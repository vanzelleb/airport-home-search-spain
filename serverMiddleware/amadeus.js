const Amadeus = require("amadeus");
const querystring = require("querystring");

export default async function (req, res, next) {
  let query = req._parsedOriginalUrl.query;
  const params = querystring.parse(query);
  //console.log("Amadeus API params: ", params);
  var amadeus = new Amadeus({
    clientId: process.env.AMADEUS_APIKEY,
    clientSecret: process.env.AMADEUS_APISECRET
  });
  
  // Airport Nearest Relevant Airport (for London)
  amadeus.referenceData.locations.airports
    .get({
      longitude: params.lon,
      latitude: params.lat
    })
    .then(function (response) {
      //console.log("Amadeus API data: ", response.data);
      // cache API response in the browser for 1 day
      res.setHeader("Cache-Control", "private, max-age=86400");
      res.end(JSON.stringify(response.data));
    })
    .catch(function (responseError) {
      console.log("Amadeus API error: ", responseError);
    });
}
