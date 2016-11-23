

      // hide the form if the browser doesn't do SVG,
      // (then just let everything else fail)
      if (!document.createElementNS) {
        document.getElementsByTagName("form")[0].style.display = "none";
      }

      // field definitions from:
      // <http://www.census.gov/popest/data/national/totals/2011/files/NST-EST2011-alldata.pdf>
      var percent = (function() {
            var fmt = d3.format(".2f");
            return function(n) { return fmt(n) + "%"; };
          })(),
          fields = [
         
            // {name: "Census Population", id: "censuspop", key: "CENSUS%dPOP", years: [2010]},
            // {name: "Estimate Base", id: "censuspop1", key: "ESTIMATESBASE%d", years: [2010]},
            {name: "SUM", id: "SUM", key: "SUM"},
            {name: "AAG2016", id: "AAG2016", key: "AAG2016"},
            {name: "AAG2015", id: "AAG2015", key: "AAG2015"},
            {name: "AAG2014", id: "AAG2014", key: "AAG2014"},
            {name: "AAG2013", id: "AAG2013", key: "AAG2013"}
          ],
          years = [2016, 2015, 2014, 2013],
          fieldsById = d3.nest()
            .key(function(d) { return d.id; })
            .rollup(function(d) { return d[0]; })
            .map(fields),
          field = fields[0],
          year = years[0],
          colors = colorbrewer.RdYlBu[3]
            .reverse()
            .map(function(rgb) { return d3.hsl(rgb); });

      var body = d3.select("body"),
          stat = d3.select("#status");

      var fieldSelect = d3.select("#field")
        .on("change", function(e) {
          field = fields[this.selectedIndex];
//          location.hash = "#" + [field.id, year].join("/");
          location.hash = "#" + field.id
        });

      fieldSelect.selectAll("option")
        .data(fields)
        .enter()
        .append("option")
          .attr("value", function(d) { return d.id; })
          .text(function(d) { return d.name; });

//      var yearSelect = d3.select("#year")
//        .on("change", function(e) {
//          year = years[this.selectedIndex];
//          location.hash = "#" + [field.id, year].join("/");
//        });
//
//      yearSelect.selectAll("option")
//        .data(years)
//        .enter()
//        .append("option")
//          .attr("value", function(y) { return y; })
//          .text(function(y) { return y; })

      var map = d3.select("#map"),
          zoom = d3.behavior.zoom()
            .translate([-38, 32])
            .scale(.94)
            .scaleExtent([0.5, 10.0])
            .on("zoom", updateZoom),
          layer = map.append("g")
            .attr("id", "layer"),
          states = layer.append("g")
            .attr("id", "states")
            .selectAll("path");

      // map.call(zoom);
      updateZoom();

      function updateZoom() {
        var scale = zoom.scale();
        layer.attr("transform",
          "translate(" + zoom.translate() + ") " +
          "scale(" + [scale, scale] + ")");
      }

      var proj = d3.geo.albersUsa(),
          topology,
          geometries,
          rawData,
          dataById = {},
          carto = d3.cartogram()
            .projection(proj)
            .properties(function(d) {
              return dataById[d.id];
            })
            .value(function(d) {
              return +d.properties[field];
            });

      window.onhashchange = function() {
        parseHash();
      };


         /*
        ********Bar chart setup*********
        */
        var margin = {top: 10, right: 20, bottom: 70, left: 80},
              width = 960 - margin.left - margin.right,
              height = 200 - margin.top - margin.bottom;

        var formatPercent = d3.format("");

        var x = d3.scale.ordinal()
                .rangeRoundBands([0, width], .1, 1);

        var y = d3.scale.linear()

            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(formatPercent);

        var svg = d3.select("#bar").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        /*END OF BAR CHART SETUP*/


        var segmentized = location.search === "?segmentized",
        url = ["data",
          segmentized ? "us-states-segmentized.topojson" : "1.json"
        ].join("/");
    d3.json(url, function(topo) {
      topology = topo;
      geometries = topology.objects.countries.geometries;
      d3.csv("data/country.csv", function(data) {
        rawData = data;
        dataById = d3.nest()
          .key(function(d) { return d.NAME; })
          .rollup(function(d) { return d[0]; })
          .map(data);
        initBar(data);
        init();
      });
    });

              function initBar(data){

            data.forEach(function(d) {
            	 d.SUM = +d.SUM;
                d.AAG2016 = +d.AAG2016;
                d.AAG2015 = +d.AAG2015;
                d.AAG2014 = +d.AAG2014;
                d.AAG2013 = +d.AAG2013;
              
              });


            x.domain(data.map(function(d) { return d.NAME; }));
            y.domain([0, 0]);


            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.selectAll("text")
                .style("text-anchor","end")
                .attr("transform", function(d) { return "translate(" + -13 + ", " + 10 + ") rotate("+270+")" });

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .attr("class","y label")
                .style("text-anchor", "end")
                .text("");

            svg.selectAll(".bar")
                .data(data)
              .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.NAME); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(0); })
                .attr("height", function(d) { return height - y(0); });

            d3.select("input").on("change", sortX);



        /*
          var sortTimeout = setTimeout(function() {
            d3.select("input").property("checked", true).each(change);
          }, 2000);
        */

        }

      function sortX() {
            //clearTimeout(sortTimeout);

            var colName = field.key.replace("%d", year);
            var data = [];
            svg.selectAll(".bar").each(function(d){data.push(d);});
            // Copy-on-write since tweens are evaluated after a delay.

            var x0 = x.domain(data.sort(document.getElementById('check').checked
                ? function(a, b) { return b[colName] - a[colName]; }
                : function(a, b) { return d3.ascending(a.NAME, b.NAME); })
                .map(function(d) { return d.NAME; }))
                .copy();

            var transition = svg.transition().duration(450),
                delay = function(d, i) { return i * 50; };

            transition.selectAll(".bar")
                .delay(delay)
                .attr("x", function(d) { return x0(d.NAME); });

            transition.select(".x.axis")
                .call(xAxis)
              .selectAll("g")
                .delay(delay);

            transition.select(".x.axis").selectAll("text")
              .style("text-anchor","end")
              .attr("transform", function(d) { return "translate(" + -13 + ", " + 10 + ") rotate("+270+")" });
          }

      function init() {
        var features = carto.features(topology, geometries),
            path = d3.geo.path()
              .projection(proj);

        states = states.data(features)
          .enter()
          .append("path")
            .attr("class", "state")
            .attr("id", function(d) {
            	console.log(d)
              return d.id;
            })
            .attr("fill", "#fafafa")
            .attr("d", path);

        states.append("title");

        parseHash();
      }

      function reset() {
        stat.text("");
        body.classed("updating", false);

        var features = carto.features(topology, geometries),
            path = d3.geo.path()
              .projection(proj);

        states.data(features)
          .transition()
            .duration(750)
            .ease("linear")
            .attr("fill", "#fafafa")
            .attr("d", path);

        states.select("title")
          .text(function(d) {
            return d.properties.NAME;
          });
      }

      function update() {
        var start = Date.now();
        body.classed("updating", true);

        var key = field.key.replace("%d", year),
            fmt = (typeof field.format === "function")
              ? field.format
              : d3.format(field.format || ","),
            value = function(d) {
              return +d.properties[key];
            },
            values = states.data()
              .map(value)
              .filter(function(n) {
                return !isNaN(n);
              })
              .sort(d3.ascending),
            lo = values[0],
            hi = values[values.length - 1];

        var color = d3.scale.linear()
          .range(colors)
          .domain(lo < 0
            ? [lo, 0, hi]
            : [lo, d3.mean(values), hi]);

        // normalize the scale to positive numbers
        var scale = d3.scale.linear()
          .domain([lo, hi])
          .range([1, 1000]);

        // tell the cartogram to use the scaled values
        carto.value(function(d) {
          return scale(value(d));
        });

        // generate the new features, pre-projected
        var features = carto(topology, geometries).features;

        // update the data
        states.data(features)
          .select("title")
            .text(function(d) {
              return [d.properties.NAME, fmt(value(d))].join(": ");
            });

        states.transition()
          .duration(750)
          .ease("linear")
          .attr("fill", function(d) {
            return color(value(d));
          })
          .attr("d", carto.path);

        var delta = (Date.now() - start) / 1000;
        stat.text(["calculated in", delta.toFixed(1), "seconds"].join(" "));
        body.classed("updating", false);
      }

      var deferredUpdate = (function() {
        var timeout;
        return function() {
          var args = arguments;
          clearTimeout(timeout);
          stat.text("calculating...");
          return timeout = setTimeout(function() {
            update.apply(null, arguments);
          }, 10);
        };
      })();

      var hashish = d3.selectAll("a.hashish")
        .datum(function() {
          return this.href;
        });

      function parseHash() {
        var parts = location.hash.substr(1).split("/"),
            desiredFieldId = parts[0],
            desiredYear = +parts[1];

        field = fieldsById[desiredFieldId] || fields[0];
        year = (years.indexOf(desiredYear) > -1) ? desiredYear : years[0];

        fieldSelect.property("selectedIndex", fields.indexOf(field));

        if (field.id === "none") {

//          yearSelect.attr("disabled", "disabled");
          reset();
          resetBar();

        } else {

//          if (field.years) {
//            if (field.years.indexOf(year) === -1) {
//              year = field.years[0];
//            }
//            yearSelect.selectAll("option")
//              .attr("disabled", function(y) {
//                return (field.years.indexOf(y) === -1) ? "disabled" : null;
//              });
//          } else {
//            yearSelect.selectAll("option")
//              .attr("disabled", null);
//          }
//
//          yearSelect
//            .property("selectedIndex", years.indexOf(year))
//            .attr("disabled", null);

          deferredUpdate();
          changeY(field.key.replace("%d", year));
//          location.replace("#" + [field.id, year].join("/"));

          hashish.attr("href", function(href) {
            return href + location.hash;
          });
        }
      }

      function changeY(colNames) {

            var data = [];
            svg.selectAll(".bar").each(function(d){data.push(d);});


            // Copy-on-write since tweens are evaluated after a delay.
            var y0 =  y.domain([0, d3.max(data, function(d) {return d[colNames]; })])
                .copy();

            var transition = svg.transition().duration(750),
                delay = function(d, i) { return i * 50; };

            transition.selectAll(".bar")
                .delay(delay)
                .attr("y", function(d) { return y0(d[colNames]); })
                .attr("height", function(d) { return height - y0(d[colNames])}).each("end", sortX);

            transition.select(".y.axis")
                .call(yAxis)
              .selectAll("g")
                .delay(delay)
                ;

             transition.select(".y.label")
               .style("text-anchor", "end")
              .text(colNames);

          }
      
      function resetBar() {

          // Copy-on-write since tweens are evaluated after a delay.
          var y0 =  y.domain([0, 0])
              .copy();

          var transition = svg.transition().duration(750),
              delay = function(d, i) { return i * 50; };

          transition.selectAll(".bar")
              .delay(delay)
              .attr("y", function(d) { return y0(0); })
              .attr("height", function(d) { return height - y0(0)});

          transition.select(".y.axis")
              .call(yAxis)
            .selectAll("g")
              .delay(delay)
              ;

           transition.select(".y.label")
             .style("text-anchor", "end")
            .text("");

        }
