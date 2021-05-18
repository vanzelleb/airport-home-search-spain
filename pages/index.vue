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
            @click="updateISOLayer(10)"
          />
          <div class="toggle toggle--active-null toggle--null">10 min 🚗</div>
        </label>
        <label class="toggle-container">
          <input
            name="duration"
            type="radio"
            value="20"
            @click="updateISOLayer(20)"
          />
          <div class="toggle toggle--active-null toggle--null">20 min 🚗</div>
        </label>
        <label class="toggle-container">
          <input
            name="duration"
            type="radio"
            value="30"
            @click="updateISOLayer(30)"
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
            @click="updateHomesLayer(100000)"
          />
          <div class="toggle toggle--active-null toggle--null">100k EUR</div>
        </label>
        <label class="toggle-container">
          <input
            name="price"
            type="radio"
            value="200000"
            @click="updateHomesLayer(200000)"
          />
          <div class="toggle toggle--active-null toggle--null">200k EUR</div>
        </label>
        <label class="toggle-container">
          <input
            name="price"
            type="radio"
            value="300000"
            @click="updateHomesLayer(300000)"
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
      map: null,
      airports: null,
      token: null,
      price: null,
      minutes: null,
    };
  },
  async mounted() {
    this.api = axios.create({
      baseURL: window.location.origin,
    });
    this.getIdealistaToken();
    this.setupMap();
    this.getAirports();
  },
  methods: {
    getIdealistaToken: async function () {
      const response = await this.api.get("/key/idealista");
      this.token = response.data.access_token;
      //console.log("Retrieved Idealista Bearer token: ", this.token);
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
          data: {
            type: "FeatureCollection",
            features: [],
          },
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

          new mapboxgl.Popup({ closeOnClick: false })
            .setLngLat(home.geometry.coordinates)
            .setHTML(
              "<h2>" +
                home.properties.price +
                " EUR / " +
                home.properties.size +
                "qm </h2><a href=" +
                home.properties.url +
                " target='_blank'><img src=" +
                home.properties.thumbnail +
                "></img></a>"
            )
            .addTo(this.map);
        }
      });
    },
    updateISOLayer: async function (minutes) {
      this.minutes = minutes;
      let params = {
        lon: this.lon,
        lat: this.lat,
        contours_minutes: minutes,
        polygons: true,
      };
      // Send a GET request to some REST api
      const response = await this.api.get("/mapbox", {
        params,
      });
      //console.log("Mapbox response: ", response.data);
      // Set the 'iso' source's data to what's returned by the API query
      this.map.getSource("iso").setData(response.data);
    },
    updateHomesLayer: async function (price) {
      this.price = price;
      let homes = {
        type: "FeatureCollection",
        features: [],
      };
      //console.log("Idealista Bearer token to use: ", this.token);
      const params = {
        center: this.lat + "," + this.lon,
        distance: 20000,
        operation: "sale",
        propertyType: "homes",
        maxPrice: price,
        maxItems: 50,
        chalet: true,
        countryHouse: true,
        subTypology: "independantHouse",
        token: this.token,
      };
      const response = await this.api.get("/idealista", { params });
      //console.log("Idealista response: ", response.data);

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
        // assign idealista home data to the geojson feature
        Object.assign(feature.properties, element);
        homes.features.push(feature);
      });
      this.map.getSource("homes").setData(homes);
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
        .setLngLat({
          lon: this.lon,
          lat: this.lat,
        })
        .addTo(this.map);
      // update the driving distance layer and homes
      if (this.minutes) this.updateISOLayer(this.minutes);
      if (this.price) this.updateHomesLayer(this.price);
    },
    getAirports: async function () {
      const params = {
        lon: this.lon,
        lat: this.lat,
      };
      const response = await this.api.get("/amadeus", { params });
      //console.log("Amadeus response: ", response.data);
      this.airports = response.data;
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