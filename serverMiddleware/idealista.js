const querystring = require("querystring");
const axios = require("axios");
const FormData = require("form-data");

export default async function (req, res, next) {
  const query = req._parsedOriginalUrl.query;
  const params = querystring.parse(query);

  try {
    const headers = {
      Authorization: "Bearer " + params.token
    };
    delete params.token;

    let formData = new FormData();
    for (const param in params) formData.append(param, params[param]);
    Object.assign(headers, formData.getHeaders());

    console.log("Idealista API header: ", headers);
    console.log("Idealista API form data: ", formData);

    const response = await axios({
      method: "post",
      url: "https://api.idealista.com/3.5/es/search",
      data: formData,
      headers: headers
    });
    // cache API response in the browser for 1 day
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.end(JSON.stringify(response.data));
  } catch (error) {
    console.error("Idealista API error: ", error);
    res.end(JSON.stringify(error));
  }
}
