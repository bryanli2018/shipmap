
function canSee(marker,southWest,northEast) {
    return(marker.data.lat<northEast.lat && marker.data.lat>southWest.lat && marker.data.lng<northEast.lng && marker.data.lng>southWest.lng);
}

addEventListener('message', function(e){
    var markerArray = e.data[0];
    var displayPointArray = e.data[1];
    var southWest = e.data[2][0];
    var northEast = e.data[2][1];
    var zoom = e.data[3];
    var count = 0;
    console.log(southWest,northEast);
    dismissMarkerArray = new Array(); //视野内的显示点
    displayMarkerArray = new Array(); //视野内待添加的点
    displayPointArray2 = new Array(); //经过筛选后添加的点
    if(zoom>=7 && zoom<10) {
        for (var i in displayPointArray) {
            try {
                if (canSee(displayPointArray[i], southWest, northEast)) {
                    dismissMarkerArray.push(markerArray[i]);
                    count++;
                }
            }
            catch (e) {
                console.log(e);
            }
        }


        for (var i in markerArray) {
            try {
                if (canSee(markerArray[i], southWest, northEast)) {
                    displayMarkerArray.push(markerArray[i]);
                }
            } catch (e) {
                console.log(e);
            }
        }

        for(var i in displayMarkerArray) {
            var data = displayMarkerArray[i].data;
            var canAdd = true;
            for (var singlePoint in displayPointArray2) {
                var x1 = displayPointArray2[singlePoint].data.lat;
                var y1 = displayPointArray2[singlePoint].data.lng;
                var distance = Math.sqrt(Math.pow(x1 - data.lat, 2) + Math.pow(y1 - data.lng, 2));
                if (distance < 0.05) {
                    canAdd = false;
                    break;
                }
            }
            if (canAdd) {
                displayPointArray2.push(displayMarkerArray[i]);
            }
        }

        message = new Array();
        message.push(dismissMarkerArray);
        message.push(displayPointArray2);
        postMessage(message);
        console.log(count);
    }
});