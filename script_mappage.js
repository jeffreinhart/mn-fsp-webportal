var map;
var ipAddress = "52.90.233.185";
var basemapOverlayUrl = "http://"+ipAddress+":6080/arcgis/rest/services/PFM_Portal_Basemap/MapServer";
var stewPlansServiceUrl = "http://dev.dnr.state.mn.us/arcgis/rest/services/for/mndnr_for_registered_forest_stewardship_plans/MapServer";
var stewPlansLayerUrl = stewPlansServiceUrl+"/0";

require(["esri/map", "esri/layers/ArcGISTiledMapServiceLayer", "esri/layers/FeatureLayer",
        "esri/dijit/Search", "esri/InfoTemplate", "dijit/form/Button",
        "dojo/_base/lang", "dojo/_base/event", "dojo/_base/array", "dojox/grid/DataGrid",
        "dojo/date/stamp", "dojo/date/locale",
        "dojo/data/ItemFileWriteStore", "esri/tasks/query", "esri/tasks/QueryTask",
        "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "dojo/_base/Color",
        "dojo/dom",
        "dojo/domReady!"],
function(Map, ArcGISTiledMapServiceLayer, FeatureLayer,
         Search, InfoTemplate, Button,
         lang, event, array, DataGrid,
         stamp, locale,
         ItemFileWriteStore, Query, QueryTask,
         SimpleFillSymbol, SimpleLineSymbol, Color,
         dom) {
    // tics to short date
    function format(date) {
        return locale.format(date, {selector: "date", datePattern: "MMM d, yyyy"});
    } // end function format

    // build plan details, input is array
    function buildPlanDetailsHtml(arr){
        planDetailsHtml = "";
        planDetailsHtml += "<p><strong>Landowner Name: </strong>"+arr.lo_fname+" "+arr.lo_lname+"</p>";
        if(arr.lo_cname){
            planDetailsHtml += "<p><strong>Company Name: </strong>"+arr.lo_cname+"</p>";
        }
        planDetailsHtml += "<p><strong>Address:</strong></p>";
        planDetailsHtml += "<p>"+arr.addr_l1+"</p>";
        if(arr.addr_l2){
            planDetailsHtml += "<p>"+arr.addr_l2+"</p>";
        }
        planDetailsHtml += "<p>"+arr.addr_city+", "+arr.addr_state+" "+arr.addr_zip+"</p>";
        if(typeof arr.date_plan === 'number'){
            formattedDate = format(new Date(arr.date_plan));
            planDetailsHtml += "<p><strong>Plan Date: </strong>"+formattedDate+"</p>";
        } else {
            planDetailsHtml += "<p><strong>Plan Date: </strong>"+arr.date_plan+"</p>";
        }
        planDetailsHtml += "<p><strong>Plan Acres: </strong>"+arr.acres_plan+"</p>";
        planDetailsHtml += "<p><strong>Registration Number: </strong>"+arr.reg_num+"</p>";
        planDetailsHtml += "<p><strong>Counties: </strong></p>";
        if(typeof arr.county1 !== 'string'){
            if(arr.county5[0] !== ""){
                planDetailsHtml += "<p>"+arr.county1+", "+arr.county2+", "+arr.county3+", "+arr.county4+", "+arr.county5+"</p>";
            } else if(arr.county4[0] !== ""){
                planDetailsHtml[0] += "<p>"+arr.county1+", "+arr.county2+", "+arr.county3+", "+arr.county4+"</p>";
            } else if(arr.county3[0] !== ""){
                planDetailsHtml += "<p>"+arr.county1+", "+arr.county2+", "+arr.county3+"</p>";
            } else if(arr.county2[0] !== ""){
                planDetailsHtml += "<p>"+arr.county1+", "+arr.county2+"</p>";
            } else {
                planDetailsHtml += "<p>"+arr.county1+"</p>";
            }
        } else {
            if(arr.county5 !== ""){
                planDetailsHtml += "<p>"+arr.county1+", "+arr.county2+", "+arr.county3+", "+arr.county4+", "+arr.county5+"</p>";
            } else if(arr.county4 !== ""){
                planDetailsHtml += "<p>"+arr.county1+", "+arr.county2+", "+arr.county3+", "+arr.county4+"</p>";
            } else if(arr.county3 !== ""){
                planDetailsHtml += "<p>"+arr.county1+", "+arr.county2+", "+arr.county3+"</p>";
            } else if(arr.county2 !== ""){
                planDetailsHtml += "<p>"+arr.county1+", "+arr.county2+"</p>";
            } else {
                planDetailsHtml += "<p>"+arr.county1+"</p>";
            }
        }
        planDetailsHtml += "<p><strong>Plan Writer:</strong></p>";
        planDetailsHtml += "<p>"+arr.for_fname+" "+arr.for_lname+"</p>";
        planDetailsHtml += "<p>"+arr.for_cname+"</p>";
        return planDetailsHtml;
    } // end function buildPlanDetailsHtml

    // initialize the map
    map = new Map("mapDiv", {
        center: [-93.6127, 46.5],
        zoom: 6,
        basemap: "satellite"
    });

    // variables for output fields in info template
    var outFieldsAll = ["pfmm_id", "county1", "county2", "county3", "county4", "county5", "lo_fname", "lo_lname", "lo_cname", "addr_l1", "addr_l2", "addr_city", "addr_state", "addr_zip", "addr_nmail", "date_plan", "date_submt", "date_rgstr", "reg_num", "acres_plan", "for_fname", "for_lname", "for_cname", "for_type"];
    var planInfoTemplate = new InfoTemplate("Plan Info", "Owner name: ${lo_fname} ${lo_lname}<br>Company Name: ${lo_cname}<br>Reg Num: ${reg_num}");

    // add the overlay tiled service for counties and PLS
    var basemapOverlaylayer = new ArcGISTiledMapServiceLayer(basemapOverlayUrl);
    map.addLayer(basemapOverlaylayer);

    // add the stewardship plans layer
    var stewPlansLayer = new FeatureLayer(stewPlansLayerUrl,{
        opacity: 0.4,
        outFields: outFieldsAll,
        infoTemplate: planInfoTemplate
    });
    map.addLayer(stewPlansLayer);

    // on click of stewardship plans layer, update the Stewardship Plan Details
    stewPlansLayer.on("click", function(evt){
        // get the graphic properties
        graphicAttributes = evt.graphic.attributes;
        // update the infoDiv
        dom.byId("planDetails").innerHTML = buildPlanDetailsHtml(graphicAttributes);
    });

    // search widget (how to search by county?)
    var search = new Search({
        autoNavigate: false,
        autoSelect: false,
        maxResults: 100,
        sources: [{
            maxSuggestions: 10,
            featureLayer: stewPlansLayer,
            searchFields: ["lo_fname", "lo_lname", "lo_cname"],
            outFields: outFieldsAll,
            displayField: "lo_lname",
            suggestionTemplate: "${lo_lname}, ${lo_fname} - ${lo_cname}",
            name: "pfmm_id",
            placeholder: "by last name, first name, or biz",
            enableSuggestions: true
        }],
        map: map
    }, "searchDiv");

    // declare grid as null to determine if it has been set as a datagrid yet
    grid = null;

    search.on("search-results", function (e) {
        // get results
        var results = e.results[0];

        // set up data store
        var data = {
            identifier: "id",
            items: []
        };

        // add search items to data store
        dojo.forEach(results, function(result, i){
            attr = result.feature.attributes;
            // format dates if not null
            if (attr.date_plan){attr.date_plan = format(new Date(attr.date_plan));}
            if (attr.date_submt){attr.date_submt = format(new Date(attr.date_submt));}
            if (attr.date_rgstr){attr.date_rgstr = format(new Date(attr.date_rgstr));}
            data.items.push({
                id: i,
                pfmm_id: attr.pfmm_id,
                county1: attr.county1,
                county2: attr.county2,
                county3: attr.county3,
                county4: attr.county4,
                county5: attr.county5,
                lo_fname: attr.lo_fname,
                lo_lname: attr.lo_lname,
                lo_cname: attr.lo_cname,
                addr_l1: attr.addr_l1,
                addr_l2: attr.addr_l2,
                addr_city: attr.addr_city,
                addr_state: attr.addr_state,
                addr_zip: attr.addr_zip,
                addr_nmail: attr.addr_nmail,
                date_plan: attr.date_plan,
                date_submt: attr.date_submt,
                date_rgstr: attr.date_rgstr,
                reg_num: attr.reg_num,
                acres_plan: attr.acres_plan,
                for_fname: attr.for_fname,
                for_lname: attr.for_lname,
                for_cname: attr.for_cname,
                for_type: attr.for_type,
                planExtent: result.extent
            });
        }); // end for each results

        // create the data store
        var store = new ItemFileWriteStore({data: data});

        // grid exists so set data store or does not exist so create grid
        if(grid){
            /* if the widget already exists, need to set the data store rather than create
             because the widget is already registered */
            grid.setStore(store);
            // enable Clear Search Results button
            dijit.byId("clearButton").setAttribute('disabled', false);
        } else {
            /* grid does not exist so create grid */
            // set up the layout for the data grid
            var layout = [[
                {'name': 'ID', 'field': 'id', 'width': '30px'},
                {'name': 'Last Name', 'field': 'lo_lname', 'width': '200px'},
                {'name': 'First Name', 'field': 'lo_fname', 'width': '200px'},
                {'name': 'Company Name', 'field': 'lo_cname', 'width': '300px'},
                {'name': 'County 1', 'field': 'county1', 'width': '160px'},
                {'name': 'County 2', 'field': 'county2', 'width': '160px'},
                {'name': 'County 3', 'field': 'county3', 'width': '160px'},
                {'name': 'County 4', 'field': 'county4', 'width': '160px'},
                {'name': 'County 5', 'field': 'county5', 'width': '160px'},
                {'name': 'Address Line 1', 'field': 'addr_l1', 'width': '300px'},
                {'name': 'Address Line 2', 'field': 'addr_l2', 'width': '300px'},
                {'name': 'City', 'field': 'addr_city', 'width': '140px'},
                {'name': 'State', 'field': 'addr_state', 'width': '60px'},
                {'name': 'Zip', 'field': 'addr_zip', 'width': '100px'},
                {'name': 'No Mailings', 'field': 'addr_nmail', 'width': '180px'},
                {'name': 'Plan Date', 'field': 'date_plan', 'width': '180px'},
                {'name': 'Plan Submission Date', 'field': 'date_submt', 'width': '180px'},
                {'name': 'Date Registered', 'field': 'date_rgstr', 'width': '180px'},
                {'name': 'Registration Number', 'field': 'reg_num', 'width': '150px'},
                {'name': 'Plan Acres', 'field': 'acres_plan', 'width': '100px'},
                {'name': 'Forester First Name', 'field': 'for_fname', 'width': '200px'},
                {'name': 'Forester Last Name', 'field': 'for_lname', 'width': '200px'},
                {'name': 'Forester Company', 'field': 'for_cname', 'width': '300px'},
                {'name': 'Forester Type', 'field': 'for_type', 'width': '150px'},
                {'name': 'PFMM Plan ID', 'field': 'pfmm_id', 'width': '400px'},
                {'name': 'Plan Extent', 'field': 'planExtent', 'width': '160px'}
            ]];

            // create grid
            grid = new DataGrid({
                id: 'gridId',
                store: store,
                structure: layout,
                rowSelector: '20px'
            });

            // append the new grid to the div
            grid.placeAt("searchResultsDiv");

            // Call startup() to render the grid
            grid.startup();

            // on row click, enable View Selected button
            dojo.connect(grid, "onRowClick", function() {
                dijit.byId("viewButton").setAttribute('disabled', false);
            });

            // grid exists, so enable Clear Selected Results button
            dijit.byId("clearButton").setAttribute('disabled', false);
        } // end if grid then set else create grid
    }); // end search.on

    // start search
    search.startup();

    var viewButton = new Button({
        label: "View Selected",
        disabled: true,
        onClick: function(e){
            // was in a grid !== null, but disabled button until rowOnClick instead
            var items = grid.selection.getSelected();

            /* could use a dojo.forEach(items, function(item, i){// get attributes from row and set as var} here,
               but can only handle one selection, so just us first item. Also was in an if items.length,
               but disabled button until rowOnClick instead */
            var selPlanArray = items[0];

            // zoom to extent
            map.setExtent(selPlanArray.planExtent[0], true);
            stewPlansLayer.setVisibility(false);
            // build query task
            var queryTask = new QueryTask(stewPlansLayerUrl);
            var query = new Query();
            query.where = "pfmm_id = '"+selPlanArray.pfmm_id[0]+"'";
            query.returnGeometry = true;
            query.outFields = outFieldsAll;
            query.outSpatialReference = map.spatialReference; // very important if not in web mercator!!
            // set up symbology
            var queryGraphicFill = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                     new Color([255,255,0]),
                                     4),
                new Color([255,255,0,.1])
            );
            // execute the query, callback for the featureset
            queryTask.execute(query, function(featureSet){
                //remove all graphics on the maps graphics layer
                map.graphics.clear();

                // only going to get one record, so no need for assigning to array and looping to add each
                var graphic = featureSet.features[0];
                graphic.setSymbol(queryGraphicFill);

                //Set the infoTemplate.
                graphic.setInfoTemplate(planInfoTemplate);

                //Add graphic to the map graphics layer.
                map.graphics.add(graphic);
            });
            // update the infoDiv
            dom.byId("planDetails").innerHTML = buildPlanDetailsHtml(selPlanArray);
            event.stop(e);
        }
    }, "viewButton").startup();

    var clearButton = new Button({
        label: "Clear Search Results",
        disabled: true,
        onClick: function(e){
            // was in if grid !== null, but changed button to disabled if no grid
            var newStore = new dojo.data.ItemFileReadStore({data: {  identifier: "",  items: []}});
            var grid = dijit.byId("gridId");
            grid.setStore(newStore);
            // clear the selection for the grid
            if (grid.selection.selectedIndex >= 0) {
                // If there is a currently selected row, deselect it now
                grid.selection.setSelected(grid.selection.selectedIndex, false);
            }
            // disable the view selected button
            dijit.byId("viewButton").setAttribute('disabled', true);
            // update the Stewardship Plan Details div
            dom.byId("planDetails").innerHTML = "<p>(search for plan information, select the plan, then click view selected)</p>";
            // clear graphics, set back to original zoom, set stewardship layer to visible
            map.graphics.clear();
            map.centerAndZoom([-93.6127, 46.5],6);
            // TODO: need something here to deal with timing between zoom and visible
            stewPlansLayer.setVisibility(true);
            // set button to disabled
            dijit.byId("clearButton").setAttribute('disabled', true);
        event.stop(e);
        }
    }, "clearButton").startup();

}); // end require
