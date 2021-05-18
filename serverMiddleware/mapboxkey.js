export default async function (req, res, next) {
  res.end(process.env.MAPBOX_ACCESSTOKEN);
}
