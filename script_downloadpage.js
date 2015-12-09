require(["esri/tasks/FindTask", "esri/tasks/FindParameters", "dijit/form/Button",
        "dojo/_base/event", "dojo/date/stamp", "dojo/date/locale",
        "dojo/store/Memory", "dijit/form/ComboBox",
        "dojo/dom",
        "dojo/domReady!"],
    function(FindTask, FindParameters, Button,
             event, stamp, locale,
             Memory, ComboBox,
             dom) {
        // to short date
        function format(date) {
            return locale.format(date, {selector: "date", datePattern: "MM/d/yyyy"});
        } // end function format

        // build list for selection box
        var countyStore = new Memory({
            data: [
                {name:'Aitkin', id: 'Aitkin'},
                {name:'Anoka', id: 'Anoka'},
                {name:'Becker', id: 'Becker'},
                {name:'Beltrami', id: 'Beltrami'},
                {name:'Benton', id: 'Benton'},
                {name:'Big Stone', id: 'Big Stone'},
                {name:'Blue Earth', id: 'Blue Earth'},
                {name:'Brown', id: 'Brown'},
                {name:'Carlton', id: 'Carlton'},
                {name:'Carver', id: 'Carver'},
                {name:'Cass', id: 'Cass'},
                {name:'Chippewa', id: 'Chippewa'},
                {name:'Chisago', id: 'Chisago'},
                {name:'Clay', id: 'Clay'},
                {name:'Clearwater', id: 'Clearwater'},
                {name:'Cook', id: 'Cook'},
                {name:'Cottonwood', id: 'Cottonwood'},
                {name:'Crow Wing', id: 'Crow Wing'},
                {name:'Dakota', id: 'Dakota'},
                {name:'Dodge', id: 'Dodge'},
                {name:'Douglas', id: 'Douglas'},
                {name:'Faribault', id: 'Faribault'},
                {name:'Fillmore', id: 'Fillmore'},
                {name:'Freeborn', id: 'Freeborn'},
                {name:'Goodhue', id: 'Goodhue'},
                {name:'Grant', id: 'Grant'},
                {name:'Hennepin', id: 'Hennepin'},
                {name:'Houston', id: 'Houston'},
                {name:'Hubbard', id: 'Hubbard'},
                {name:'Isanti', id: 'Isanti'},
                {name:'Itasca', id: 'Itasca'},
                {name:'Jackson', id: 'Jackson'},
                {name:'Kanabec', id: 'Kanabec'},
                {name:'Kandiyohi', id: 'Kandiyohi'},
                {name:'Kittson', id: 'Kittson'},
                {name:'Koochiching', id: 'Koochiching'},
                {name:'Lac qui Parle', id: 'Lac qui Parle'},
                {name:'Lake', id: 'Lake'},
                {name:'Lake of the Woods', id: 'Lake of the Woods'},
                {name:'Le Sueur', id: 'Le Sueur'},
                {name:'Lincoln', id: 'Lincoln'},
                {name:'Lyon', id: 'Lyon'},
                {name:'Mahnomen', id: 'Mahnomen'},
                {name:'Marshall', id: 'Marshall'},
                {name:'Martin', id: 'Martin'},
                {name:'McLeod', id: 'McLeod'},
                {name:'Meeker', id: 'Meeker'},
                {name:'Mille Lacs', id: 'Mille Lacs'},
                {name:'Morrison', id: 'Morrison'},
                {name:'Mower', id: 'Mower'},
                {name:'Murray', id: 'Murray'},
                {name:'Nicollet', id: 'Nicollet'},
                {name:'Nobles', id: 'Nobles'},
                {name:'Norman', id: 'Norman'},
                {name:'Olmsted', id: 'Olmsted'},
                {name:'Otter Tail', id: 'Otter Tail'},
                {name:'Pennington', id: 'Pennington'},
                {name:'Pine', id: 'Pine'},
                {name:'Pipestone', id: 'Pipestone'},
                {name:'Polk', id: 'Polk'},
                {name:'Pope', id: 'Pope'},
                {name:'Ramsey', id: 'Ramsey'},
                {name:'Red Lake', id: 'Red Lake'},
                {name:'Redwood', id: 'Redwood'},
                {name:'Renville', id: 'Renville'},
                {name:'Rice', id: 'Rice'},
                {name:'Rock', id: 'Rock'},
                {name:'Roseau', id: 'Roseau'},
                {name:'Scott', id: 'Scott'},
                {name:'Sherburne', id: 'Sherburne'},
                {name:'Sibley', id: 'Sibley'},
                {name:'St. Louis', id: 'St. Louis'},
                {name:'Stearns', id: 'Stearns'},
                {name:'Steele', id: 'Steele'},
                {name:'Stevens', id: 'Stevens'},
                {name:'Swift', id: 'Swift'},
                {name:'Todd', id: 'Todd'},
                {name:'Traverse', id: 'Traverse'},
                {name:'Wabasha', id: 'Wabasha'},
                {name:'Wadena', id: 'Wadena'},
                {name:'Waseca', id: 'Waseca'},
                {name:'Washington', id: 'Washington'},
                {name:'Watonwan', id: 'Watonwan'},
                {name:'Wilkin', id: 'Wilkin'},
                {name:'Winona', id: 'Winona'},
                {name:'Wright', id: 'Wright'},
                {name:'Yellow Medicine', id: 'Yellow Medicine'}
            ]
        }); // end build list for selection box

        var comboBox = new ComboBox({
            id: "countySelect",
            name: "county",
            value: "Aitkin",
            store: countyStore,
            searchAttr: "name"
        }, "countySelect").startup();

        var getTable = new Button({
            label: "Get Table",
            onClick: function(e){
                var countySelected = dijit.byId("countySelect").get('value');
                var find, params;
                find = new FindTask("http://dev.dnr.state.mn.us/arcgis/rest/services/for/mndnr_for_registered_forest_stewardship_plans/MapServer");
                params = new FindParameters();
                params.layerIds = [0];
                params.searchFields = ["county1", "county2", "county3", "county4", "county5"];
                params.searchText = countySelected;
                find.execute(params, function(results){
                    // if results build table else give message
                    if(results.length > 0){
                        // variable to hold csv content
                        var csvContent = "data:text/csv;charset=utf-8,";
                        // add header row
                        csvContent += "County 1,County 2,County 3,County 4,County 5,Landowner First Name,Landowner Last Name,Landowner Company,Address Line 1,Address Line 2,Address City,Address State,Address Zip,No Mailings,Date Plan,Date Submitted,Date Registered,Registration Number,Acres Plan,Forester First Name,Forester Last Name,Forester Company Name,Forester Type,PFMM ID\n";
                        // add rows for records
                        dojo.forEach(results,function(result){
                            attr = result.feature.attributes;
                            // format dates if not null
                            if (attr["Date Plan"]){attr["Date Plan"] = format(new Date(attr["Date Plan"]));}
                            if (attr["Date Submitted"]){attr["Date Submitted"] = format(new Date(attr["Date Submitted"]));}
                            if (attr["Date Registered"]){attr["Date Registered"] = format(new Date(attr["Date Registered"]));}
                            csvContent += '"'+attr["County 1"]+'",';
                            csvContent += '"'+attr["County 2"]+'",';
                            csvContent += '"'+attr["County 3"]+'",';
                            csvContent += '"'+attr["County 4"]+'",';
                            csvContent += '"'+attr["County 5"]+'",';
                            csvContent += '"'+attr["Landowner First Name"]+'",';
                            csvContent += '"'+attr["Landowner Last Name"]+'",';
                            csvContent += '"'+attr["Landowner Company"]+'",';
                            csvContent += '"'+attr["Address Line 1"]+'",';
                            csvContent += '"'+attr["Address Line 2"]+'",';
                            csvContent += '"'+attr["Address City"]+'",';
                            csvContent += '"'+attr["Address State"]+'",';
                            csvContent += '"'+attr["Address Zip"]+'",';
                            csvContent += '"'+attr["No Mailings"]+'",';
                            csvContent += '"'+attr["Date Plan"]+'",';
                            csvContent += '"'+attr["Date Submitted"]+'",';
                            csvContent += '"'+attr["Date Registered"]+'",';
                            csvContent += '"'+attr["Registration Number"]+'",';
                            csvContent += '"'+attr["Acres Plan"]+'",';
                            csvContent += '"'+attr["Forester First Name"]+'",';
                            csvContent += '"'+attr["Forester Last Name"]+'",';
                            csvContent += '"'+attr["Forester Company Name"]+'",';
                            csvContent += '"'+attr["Forester Type"]+'",';
                            csvContent += '"'+attr["PFMM ID"]+'",\n';
                        });
                        // build link for table download
                        var encodedUri = encodeURI(csvContent);
                        linkHtml = "<a href='' id='searchResultsLink'>"+"Click here to download table of registered forest stewardship plans in "+countySelected+" County"+"</a>";
                        dom.byId("searchResultsMessage").innerHTML = linkHtml;
                        var link = dom.byId("searchResultsLink");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", countySelected+" Forest Stew Plans.csv");
                    } else {
                        dom.byId("searchResultsMessage").innerHTML = "No registered forest stewardship plans in "+countySelected+" County.";
                    }
                }); // end find.execute()
                event.stop(e);
            } // end onclick for getTable button
        }, "getTable").startup();

        var regStewPlansPage = new Button({
            label: "Search for Registered<br>Forest Stewardship Plans",
            onClick: function(e){
                window.location.href = 'reg-stew-plans.html';
                event.stop(e);
            }
        }, "regStewPlansPage").startup();

        var regStewPlansCountyPage = new Button({
            label: "Get Registered Forest<br>Stewardship Plans for a County",
            onClick: function(e){
                window.location.href = 'reg-stew-plans-by-county.html';
                event.stop(e);
            }
        }, "regStewPlansCountyPage").startup();
    }); // end require