export default {
  head: {
    script: [
      { src: "https://api.mapbox.com/mapbox-gl-js/v2.2.0/mapbox-gl.js" },
      { src: "https://api.mapbox.com/mapbox-assembly/v0.26.0/assembly.js" }
    ],
    link: [
      {
        rel: "stylesheet",
        href: "https://api.mapbox.com/mapbox-gl-js/v2.2.0/mapbox-gl.css"
      },
      {
        rel: "stylesheet",
        href: "https://api.mapbox.com/mapbox-assembly/v0.26.0/assembly.min.css"
      }
    ]
  },
  serverMiddleware: [
    { path: "/mapbox", handler: "~/serverMiddleware/mapbox.js" },
    { path: "/key/mapbox", handler: "~/serverMiddleware/mapboxkey.js" },
    { path: "/amadeus", handler: "~/serverMiddleware/amadeus.js" },
    { path: "/key/idealista", handler: "~/serverMiddleware/idealistakey.js" },
    { path: "/idealista", handler: "~/serverMiddleware/idealista.js" }
  ],
  target: "static"
};
