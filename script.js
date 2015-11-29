/*
 Use domReady! for simple apps. Switch to dojo/ready if app uses parseOnLoad: true,
 Dojo Dijits, widgets from the Esri library or custom dijits.
 Declaring the map as a global is useful for debugging.
 */
var map;
var ipAddress = "54.173.198.121";
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
    // initialize the map
    map = new Map("mapDiv", {
        center: [-93.6127, 46.5],
        zoom: 6,
        basemap: "satellite"
    });

    function format(date) {
        return locale.format(date, {selector: "date", datePattern: "MMM d, yyyy"});
    }

    // variables for output fields in info template
    var outFields = ["pfmm_id", "county1", "county2", "county3", "county4", "county5", "lo_fname", "lo_lname", "lo_cname", "addr_l1", "addr_l2", "addr_city", "addr_state", "addr_zip", "addr_nmail", "date_plan", "date_submt", "date_rgstr", "reg_num", "acres_plan", "for_fname", "for_lname", "for_cname", "for_type"];
    var planInfoTemplate = new InfoTemplate("Plan", "Owner name: ${lo_fname} ${lo_lname}<br>Reg Num: ${reg_num}");

    // add the overlay tiled service for counties and PLS
    var basemapOverlaylayer = new ArcGISTiledMapServiceLayer(basemapOverlayUrl);
    map.addLayer(basemapOverlaylayer);

    // add the stewardship plans layer
    var stewPlansLayer = new FeatureLayer(stewPlansLayerUrl,{
        opacity: 0.4,
        outFields: ["*"],
        infoTemplate: planInfoTemplate
    });
    map.addLayer(stewPlansLayer);

    // search widget (how to search by county?)
    var search = new Search({
        autoNavigate: false,
        autoSelect: false,
        maxResults: 100,
        sources: [{
            maxSuggestions: 10,
            featureLayer: stewPlansLayer,
            searchFields: ["lo_fname", "lo_lname", "lo_cname"],
            outFields: outFields,
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
        console.log("search");
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
                pfmmId: attr.pfmm_id,
                County1: attr.county1,
                County2: attr.county2,
                County3: attr.county3,
                County4: attr.county4,
                County5: attr.county5,
                loFname: attr.lo_fname,
                loLname: attr.lo_lname,
                loCname: attr.lo_cname,
                addrL1: attr.addr_l1,
                addrL2: attr.addr_l2,
                addrCity: attr.addr_city,
                addrState: attr.addr_state,
                addrZip: attr.addr_zip,
                addrNmail: attr.addr_nmail,
                datePlan: attr.date_plan,
                dateSubmt: attr.date_submt,
                dateRgstr: attr.date_rgstr,
                regNum: attr.reg_num,
                acresPlan: attr.acres_plan,
                forFname: attr.for_fname,
                forLname: attr.for_lname,
                forCname: attr.for_cname,
                forType: attr.for_type,
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
                {'name': 'Last Name', 'field': 'loLname', 'width': '200px'},
                {'name': 'First Name', 'field': 'loFname', 'width': '200px'},
                {'name': 'Company Name', 'field': 'loCname', 'width': '300px'},
                {'name': 'County 1', 'field': 'County1', 'width': '160px'},
                {'name': 'County 2', 'field': 'County2', 'width': '160px'},
                {'name': 'County 3', 'field': 'County3', 'width': '160px'},
                {'name': 'County 4', 'field': 'County4', 'width': '160px'},
                {'name': 'County 5', 'field': 'County5', 'width': '160px'},
                {'name': 'Address Line 1', 'field': 'addrL1', 'width': '300px'},
                {'name': 'Address Line 2', 'field': 'addrL2', 'width': '300px'},
                {'name': 'City', 'field': 'addrCity', 'width': '140px'},
                {'name': 'State', 'field': 'addrState', 'width': '60px'},
                {'name': 'Zip', 'field': 'addrZip', 'width': '100px'},
                {'name': 'No Mailings', 'field': 'addrNmail', 'width': '180px'},
                {'name': 'Plan Date', 'field': 'datePlan', 'width': '180px'},
                {'name': 'Plan Submission Date', 'field': 'dateSubmt', 'width': '180px'},
                {'name': 'Date Registered', 'field': 'dateRgstr', 'width': '180px'},
                {'name': 'Registration Number', 'field': 'regNum', 'width': '150px'},
                {'name': 'Plan Acres', 'field': 'acresPlan', 'width': '100px'},
                {'name': 'Forester First Name', 'field': 'forFname', 'width': '200px'},
                {'name': 'Forester Last Name', 'field': 'forLname', 'width': '200px'},
                {'name': 'Forester Company', 'field': 'forCname', 'width': '300px'},
                {'name': 'Forester Type', 'field': 'forType', 'width': '150px'},
                {'name': 'PFMM Plan ID', 'field': 'pfmmId', 'width': '400px'},
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
            dojo.connect(grid, "onRowClick", function(e) {
                console.log("hey now");
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

            // was in an if items.length, but disabled button until rowOnClick instead
            dojo.forEach(items, function(item, i){
                // get attributes from row
                selPlanExtent = item.planExtent[0];
                selPfmmId = item.pfmmId[0];
                selLoLname = item.loLname[0];
                selLoFname = item.loFname[0];
                selLoCname = item.loCname[0];
                selCounty1 = item.County1[0];
                selCounty2 = item.County2[0];
                selCounty3 = item.County3[0];
                selCounty4 = item.County4[0];
                selCounty5 = item.County5[0];
                selAddrL1 = item.addrL1[0];
                selAddrL2 = item.addrL2[0];
                selAddrCity = item.addrCity[0];
                selAddrState = item.addrState[0];
                selAddrZip = item.addrZip[0];
                selDatePlan = item.datePlan[0];
                selDateSubmt = item.dateSubmt[0];
                selDateRgstr = item.dateRgstr[0];
                selRegNum = item.regNum[0];
                selAcresPlan = item.acresPlan[0];
                selForFname = item.forFname[0];
                selForLname = item.forLname[0];
                selForCname = item.forCname[0];
                selForType = item.forType[0];
            }); // end for each results
            // zoom to extent
            map.setExtent(selPlanExtent, true);
            stewPlansLayer.setVisibility(false);
            // build query task
            var queryTask = new QueryTask(stewPlansLayerUrl);
            var query = new Query();
            query.where = "pfmm_id = '"+selPfmmId+"'";
            query.returnGeometry = true;
            query.outFields = outFields;
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
            var planDetailsHtml = "";
            planDetailsHtml += "<p><strong>Landowner Name: </strong>"+selLoFname+" "+selLoLname+"</p>";
            if(selLoCname){
                planDetailsHtml += "<p><strong>Company Name: </strong>"+selLoCname+"</p>";
            }
            planDetailsHtml += "<p><strong>Address:</strong></p>";
            planDetailsHtml += "<p>"+selAddrL1+"</p>";
            if(selAddrL2){
                planDetailsHtml += "<p>"+selAddrL2+"</p>";
            }
            planDetailsHtml += "<p>"+selAddrCity+", "+selAddrState+" "+selAddrZip+"</p>";
            planDetailsHtml += "<p><strong>Plan Date: </strong>"+selDatePlan+"</p>";
            planDetailsHtml += "<p><strong>Plan Acres: </strong>"+selAcresPlan+"</p>";
            planDetailsHtml += "<p><strong>Registration Number: </strong>"+selRegNum+"</p>";
            planDetailsHtml += "<p><strong>Counties: </strong></p>";
            if(selCounty5){
                planDetailsHtml += "<p>"+selCounty1+", "+selCounty2+", "+selCounty3+", "+selCounty4+", "+selCounty5+"</p>";
            } else if(selCounty4){
                planDetailsHtml += "<p>"+selCounty1+", "+selCounty2+", "+selCounty3+", "+selCounty4+"</p>";
            } else if(selCounty3){
                planDetailsHtml += "<p>"+selCounty1+", "+selCounty2+", "+selCounty3+"</p>";
            } else if(selCounty2){
                planDetailsHtml += "<p>"+selCounty1+", "+selCounty2+"</p>";
            } else {
                planDetailsHtml += "<p>"+selCounty1+"</p>";
            }
            planDetailsHtml += "<p><strong>Plan Writer:</strong></p>";
            planDetailsHtml += "<p>"+selForFname+" "+selForLname+"</p>";
            planDetailsHtml += "<p>"+selForCname+"</p>";
            dom.byId("planDetails").innerHTML = planDetailsHtml;
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
            stewPlansLayer.setVisibility(true);
            // set button to disabled
            dijit.byId("clearButton").setAttribute('disabled', true);
        event.stop(e);
        }
    }, "clearButton").startup();

}); // end require