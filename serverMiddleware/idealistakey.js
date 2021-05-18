const axios = require("axios");
//const oauth = require("axios-oauth-client");
const qs = require("qs");

export default async function (req, res, next) {
  /*try {
    const getClientCredentials = oauth.client(axios.create(), {
      url: "https://api.idealista.com/oauth/token",
      grant_type: "client_credentials",
      client_id: process.env.IDEALISTA_KEY,
      client_secret: process.env.IDEALISTA_SECRET,
      scope: "read"
    });

    const auth = await getClientCredentials();
    console.error("Idealista token: ", auth);
    res.setHeader("Cache-Control", "private, max-age=43200");
    res.end(JSON.stringify(auth));
    
      } catch (error) {
    console.error("Idealista API error: ", error);
  }*/

  const data = {
    grant_type: "client_credentials",
    scope: "read",
    client_id: process.env.IDEALISTA_KEY,
    client_secret: process.env.IDEALISTA_SECRET
  };
  const headers = {
    "content-type": "application/x-www-form-urlencoded"
  };
  axios({
    method: "post",
    url: "https://api.idealista.com/oauth/token",
    data: qs.stringify(data),
    headers: headers
  })
    .then((response) => {
      console.error("Idealista token: ", response.data);
      res.setHeader("Cache-Control", "private, max-age=43200");
      res.end(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.error("Idealista API error: ", error);
    });
}
