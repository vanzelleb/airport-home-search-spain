const querystring = require("querystring");
const axios = require("axios");

export default async function (req, res, next) {
  const query = req._parsedOriginalUrl.query;
  const params = querystring.parse(query);
  const url = "https://api.mapbox.com/isochrone/v1/mapbox/driving/".concat(
    params.lon,
    ",",
    params.lat
  );
  // remove parameters that are not needed in final API call to mapbox
  delete params.lon;
  delete params.lat;
  // add API secret
  params.access_token = process.env.MAPBOX_ACCESSTOKEN;
  //console.log("Mapbox API url: ", url);
  //console.log("Mapbox API params: ", params);
  try {
    const response = await axios.get(url, { params });
    // cache API response in the browser for 1 day
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.end(JSON.stringify(response.data));
  } catch (error) {
    console.error("Mapbox API error: ", error);
  }
}
