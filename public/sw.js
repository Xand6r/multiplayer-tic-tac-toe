
self.skipWaiting()
self.addEventListener("install",e=>{
    const urlsToCache=[
        "/",
        "js/jquery-3.3.1.js",
        "js/materialize.min.js",
        "js/script.js",
        "js/vue.js"

    ]
// testing123
    e.waitUntil(
        caches.open("hexano-v4").then(function(cache){
            return cache.addAll([
                "/",
                "/js/jquery-3.3.1.js",
                "/js/materialize.min.js",
                "/js/script.js",
                "/js/vue.js",
                "/css/materialize.min.1.css",
                "/css/style.css",
                "/fonts/roboto/Roboto-Light.woff2",
                "/fonts/roboto/Roboto-Regular.woff2"
            ])
        })
    )
});

self.addEventListener("fetch",e=>{
    e.respondWith(
        caches.match(e.request)
        .then(res=>{
            if(res){
                return res;
            }
            else{
                return fetch(e.request)
            }
        })
    )
})
