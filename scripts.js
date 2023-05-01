const defaultStyle = {
    color: "blue",
    opacity: 0.5,
    weight: 2
};

const selectedStyle = {
    color: "red",
    opacity: 1,
    weight: 5
};

const fadedStyle = {
    color: "blue",
    opacity: 0.1,
    weight: 2
};

const map = L.map('map').setView([42.3683386, -71.1128359], 11.74);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
})
.addTo(map);

let routeDivs = [], geojson = null;

async function fetchRoutes() {
    const file = "routes_file.txt";
    return fetch(file)
        .then(r => r.text())
        .then(text => {
            const lines = text.trim().split("\n");

            const routesContainer = document.querySelector("#routes");
            for (let i = 0; i < lines.length; i += 3) {
                const routeNum = lines[i];
                const routeDesc = lines[i + 1];
                const stops = lines[i + 2].split(",");

                const routeDiv = document.createElement("div");
                routeDiv.classList.add("route");
                routeDiv.id = `route-${routeNum}`;
                routesContainer.appendChild(routeDiv);

                routeDivs.push(routeDiv);

                const routeHeading = document.createElement("h2");
                routeHeading.innerText = `${routeNum}`;
                routeDiv.appendChild(routeHeading);

                const routeDescription = document.createElement("div");
                routeDescription.innerText = routeDesc;
                routeDiv.appendChild(routeDescription);

                const links = document.createElement("div");
                links.classList.add("links");
                routeDiv.appendChild(links);

                const gmaps = document.createElement("a");
                gmaps.innerText = "Google Maps";
                const firstStop = stops[0];
                const lastStop = stops[stops.length - 1];
                gmaps.href = `https://www.google.com/maps/dir/${firstStop}/${lastStop}`;
                gmaps.target = "_blank";
                links.appendChild(gmaps);

                const mbta = document.createElement("a");
                mbta.innerText = "MBTA";
                mbta.href = `https://www.mbta.com/schedules/${routeNum}`;
                mbta.target = "_blank";
                links.appendChild(mbta);

                const details = document.createElement("details");
                const summary = document.createElement("summary");
                summary.innerText = "Stops";
                details.appendChild(summary);
                const stopsList = document.createElement("ul");
                for (let stop of stops) {
                    const stopListItem = document.createElement("li");
                    stopListItem.innerText = stop;
                    stopsList.appendChild(stopListItem);
                }
                details.appendChild(stopsList);
                routeDiv.appendChild(details);
            }
        });
}

async function fetchGeoJSON() {
    const url = 'https://gis.massdot.state.ma.us/arcgis/rest/services/Multimodal/GTFS_Systemwide/MapServer/5/query?outFields=*&where=1%3D1&f=geojson';
    return fetch(url)
        .then(r => r.json())
        .then(features => {
            geojson = L.geoJSON(features, { style: () => defaultStyle })
                .on("click", e => {
                    e.target.setStyle(fadedStyle);
                    e.layer.setStyle(selectedStyle);
                    let routeShor = e.layer.feature.properties.route_short_name;
                    if (routeShor.substring(0, 1) === "T") {
                        routeShor = routeShor.substring(1);
                    }
                    document.querySelector(".route.current")?.classList.remove("current");
                    const div = document.querySelector(`#route-${routeShor}`);
                    if (div) {
                        div.classList.add("current");
                        div.scrollIntoView(true, { behavior: "smooth" });
                    }
                })
                .addTo(map);
        });
}

function init() {
    Promise.all([fetchRoutes(), fetchGeoJSON()])
    .then(() => {
        document.querySelector("#loading").style.display = "none";

        routeDivs.forEach(div => {
            const num = div.id.split("-")[1];
            div.addEventListener("click", () => {
                div.scrollIntoView(true, { behavior: "smooth" });
                routeDivs.forEach(d => d.classList.toggle("current", d === div));
                geojson.eachLayer(function (layer) {
                    if (layer.feature.properties.route_short_name === num) {
                        layer.setStyle(selectedStyle);
                    } else {
                        layer.setStyle(fadedStyle);
                    }
                });
            });
        });

        window.addEventListener("keydown", e => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                const currentDiv = document.querySelector(".route.current");
                if (currentDiv) {
                    const index = Array.from(routeDivs).indexOf(currentDiv);
                    if (e.key === "ArrowRight") {
                        routeDivs[index + 1]?.click();
                    } else {
                        routeDivs[index - 1]?.click();
                    }
                }
            } else if (e.key === "Escape") {
                geojson.setStyle(defaultStyle);
                document.querySelector(".route.current")?.classList.remove("current");
            }
        });

        const routesContainer = document.querySelector("#routes");
        routesContainer.addEventListener("click", e => {
            if (e.target === routesContainer) {
                geojson.setStyle(defaultStyle);
                document.querySelector(".route.current")?.classList.remove("current");
            }
        })
    });
}

init();