var width = 960,
    height = 500;

var radius = d3.scale.sqrt()
    .domain([0, 100])
    .range([0, 30]);

var path = d3.geo.path();

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

var formatNumber = d3.format(",.0f");





queue()
    .defer(d3.json, "data/us2.json")
    .defer(d3.json, "data/b2016.json")
    .await(ready);

function ready(error, us, centroid) {
  if (error) throw error;

  svg.append("path")
      .attr("class", "states")
      .datum(topojson.feature(us, us.objects.states))
      .attr("d", path);

  svg.selectAll(".symbol")
      .data(centroid.features.sort(function(a, b) { return b.properties.population - a.properties.population; }))
    .enter().append("path")
      .attr("class", "symbol")
      .attr("d", path.pointRadius(function(d) { return radius(d.properties.population); }))
      .append("title")
      .text(function(d) {
        return d.properties.name
            + ":" + formatNumber(d.properties.population);
      });
}

function gen(year){
	queue()
	.defer(d3.json, "data/us2.json")
    .defer(d3.json, "data/b"+year+".json")
    .await(ready);
}
