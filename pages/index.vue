<template>
  <main>
    <div id="map"></div>
    <div class="absolute fl my24 mx24 py24 px24 bg-gray-faint round">
      <h4 class="txt-m txt-bold mb6">Choose an airport:</h4>
      <div v-for="airport in airports" @click="goTo(airport.geoCode)">
        <a href="#" role="button">{{ airport.detailedName }}</a>
      </div>

      <h4 class="txt-m txt-bold mb6 mt24">Choose a maximum drive duration:</h4>
      <div class="mb12 mr12 toggle-group align-center">
        <label class="toggle-container">
          <input
            name="duration"
            type="radio"
            value="10"
            @click="setDuration(10)"
          />
          <div class="toggle toggle--active-null toggle--null">10 min 🚗</div>
        </label>
        <label class="toggle-container">
          <input
            name="duration"
            type="radio"
            value="20"
            @click="setDuration(20)"
          />
          <div class="toggle toggle--active-null toggle--null">20 min 🚗</div>
        </label>
        <label class="toggle-container">
          <input
            name="duration"
            type="radio"
            value="30"
            @click="setDuration(30)"
            checked
          />
          <div class="toggle toggle--active-null toggle--null">30 min 🚗</div>
        </label>
      </div>

      <h4 class="txt-m txt-bold mb6 mt24">Choose a maximum home price:</h4>
      <div class="mb12 mr12 toggle-group align-center">
        <label class="toggle-container">
          <input
            name="price"
            type="radio"
            value="100000"
            @click="setPrice(100000)"
          />
          <div class="toggle toggle--active-null toggle--null">100k EUR</div>
        </label>
        <label class="toggle-container">
          <input
            name="price"
            type="radio"
            value="200000"
            @click="setPrice(200000)"
            checked
          />
          <div class="toggle toggle--active-null toggle--null">200k EUR</div>
        </label>
        <label class="toggle-container">
          <input
            name="price"
            type="radio"
            value="300000"
            @click="setPrice(300000)"
          />
          <div class="toggle toggle--active-null toggle--null">300k EUR</div>
        </label>
      </div>
    </div>
  </main>
</template>

<script>
import mapboxgl from "mapbox-gl";
import axios from "axios";

export default {
  data() {
    return {
      api: null,
      lat: 40.4168,
      lon: -3.7038,
      minutes: 30,
      map: null,
      airports: null,
      token: null,
      homes: {
        type: "FeatureCollection",
        features: [],
      },
      homePrice: 200000,
    };
  },
  async fetch(context) {},
  async mounted() {
    this.api = axios.create({
      baseURL: window.location.origin,
      //headers: { "Cache-Control": "private,max-age=100000" },
    });

    this.getIdealistaToken();

    this.setupMap();

    this.getAirports();
  },
  computed: {
    lngLat: function () {
      // Create a LngLat object to use in the marker initialization
      // https://docs.mapbox.com/mapbox-gl-js/api/#lnglat
      return {
        lon: this.lon,
        lat: this.lat,
      };
    },
  },
  methods: {
    getIdealistaToken: async function () {
      const response = await this.api.get("/key/idealista");
      this.token = response.data.access_token;
      console.log("Retrieved Idealista Bearer token: ", this.token);
    },
    setupMap: async function () {
      const response = await this.api.get("/key/mapbox");
      mapboxgl.accessToken = response.data;

      this.map = new mapboxgl.Map({
        container: "map", // container id
        style: "mapbox://styles/mapbox/streets-v11", // stylesheet
        center: [this.lon, this.lat], // starting position [lng, lat]
        zoom: 10,
      });

      this.map.on("load", () => {
        // When the map loads, add the source and layer
        this.map.addSource("iso", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        this.map.addSource("homes", {
          type: "geojson",
          data: this.homes,
        });

        this.map.addLayer(
          {
            id: "isoLayer",
            type: "fill",
            source: "iso",
            layout: {},
            paint: {
              "fill-color": "#5a3fc0",
              "fill-opacity": 0.3,
            },
          },
          "poi-label"
        );

        this.map.addLayer({
          id: "homes",
          type: "circle",
          /* Add a GeoJSON source containing place coordinates and information. */
          source: "homes",
        });
      });

      this.map.on("click", (e) => {
        /* Determine if a feature in the "locations" layer exists at that point. */
        var features = this.map.queryRenderedFeatures(e.point, {
          layers: ["homes"],
        });

        /* If yes, then: */
        if (features.length) {
          var home = features[0];

          /* Fly to the point */
          this.map.flyTo({
            center: home.geometry.coordinates,
            essential: true, // this animation is considered essential with respect to prefers-reduced-motion
          });

          /* Close all other popups and display popup for clicked store */
          var popUps = document.getElementsByClassName("mapboxgl-popup");
          /** Check if there is already a popup on the map and if so, remove it */
          if (popUps[0]) popUps[0].remove();

          var popup = new mapboxgl.Popup({ closeOnClick: false })
            .setLngLat(home.geometry.coordinates)
            .setHTML(
              "<h3>" +
                home.properties.price +
                " EUR / " +
                home.properties.size +
                "qm </h3>" +
                "<a href=" +
                home.properties.url +
                " target='_blank'><img src=" +
                home.properties.thumbnail +
                "></img></a>"
            )
            .addTo(this.map);
        }
      });
    },
    updateISO: async function () {
      let params = {
        lon: this.lon,
        lat: this.lat,
        contours_minutes: this.minutes,
        polygons: true,
      };
      // Send a GET request to some REST api
      const response = await this.api.get("/mapbox", {
        params,
      });
      console.log("Mapbox response: ", response.data);
      // Set the 'iso' source's data to what's returned by the API query
      this.map.getSource("iso").setData(response.data);
    },
    setDuration: function (min) {
      this.minutes = min;
      this.updateISO();
    },
    setPrice: function (price) {
      this.homePrice = price;
      this.updateHomes();
    },
    goTo: async function ({ latitude, longitude }) {
      this.lon = longitude;
      this.lat = latitude;
      this.map.flyTo({
        center: [this.lon, this.lat],
        essential: true, // this animation is considered essential with respect to prefers-reduced-motion
      });
      // set the marker to the new location
      // Set up a marker that you can use to show the query's coordinates
      new mapboxgl.Marker({
        color: "#314ccd",
      })
        .setLngLat(this.lngLat)
        .addTo(this.map);
      // update the driving distance layer
      this.updateISO();

      this.updateHomes();
    },
    getAirports: async function () {
      const params = this.lngLat;
      const response = await this.api.get("/amadeus", { params });
      //console.log("Amadeus response: ", response.data);
      this.airports = response.data;
    },
    updateHomes: async function () {
      console.log("Idealista Bearer token to use: ", this.token);
      const params = {
        center: this.lngLat.lat + "," + this.lngLat.lon,
        distance: 20000,
        operation: "sale",
        propertyType: "homes",
        maxPrice: this.homePrice,
        maxItems: 50,
        chalet: true,
        countryHouse: true,
        subTypology: "independantHouse",
        token: this.token,
      };
      const response = await this.api.get("/idealista", { params });
      console.log("Idealista response: ", response.data);

      response.data.elementList.forEach((element) => {
        let feature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [],
          },
          properties: {},
        };
        feature.geometry.coordinates.push(element.longitude);
        feature.geometry.coordinates.push(element.latitude);
        Object.assign(feature.properties, element);
        this.homes.features.push(feature);
      });
      this.map.getSource("homes").setData(this.homes);
    },
  },
};
</script>

<style>
main,
body {
  margin: 0;
  padding: 0;
}

#map {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
}
</style>