function base64ArrayBuffer(arrayBuffer) {
  var base64    = ''
  var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  var bytes         = new Uint8Array(arrayBuffer)
  var byteLength    = bytes.byteLength
  var byteRemainder = byteLength % 3
  var mainLength    = byteLength - byteRemainder

  var a, b, c, d
  var chunk

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63               // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength]

    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4 // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }
  
  return base64
}

var b64s = "";

function readspm(){
    var file = spmfile.files[0];
    var reader = new FileReader();
    reader.onloadend = function(evt) {
        var f = evt.target.result.split('\n');
        for(var i=0; f[i]!='top to bottom'; i++){}
        var size = {x: parseInt(f[i+1]), y: parseInt(f[i+2]) };
        console.log("SIZE",size);
        for(i+=3; f[i]!='end of header'; i++){}
        var buffer = new ArrayBuffer(4*size.x*size.y);
        var dview = new DataView(buffer);
        var dmin = parseFloat(f[i+1]);
        var dmax = parseFloat(f[i+1]);
        for(var y=0;y<size.y;y++){
            for(var x=0;x<size.x;x++){
                var value = parseFloat(f[i+1+size.x*y+x]);
                dview.setFloat32((size.x*(size.y-y-1)+x)*4,value, true)
                if(value<dmin) dmin=value;
                if(value>dmax) dmax=value;
            }
        }
        b64s = base64ArrayBuffer(buffer);
        var c = $('#spmcanvas')[0];
        c.width = size.x;
        c.height = size.y;
        var ctx = c.getContext("2d");
        var myImageData = ctx.createImageData(size.x, size.y);
        for(var y=0; y<size.y; y++){
            for(var x=0; x<size.x; x++){
                var value = parseFloat(f[i+1+(size.x*(size.y-y)+x)]);
                new DataView(buffer).setFloat32(4*(size.x*y+x), value, true);
                var norm = Math.round(255*(value-dmin)/(dmax-dmin));
                for(var k=0; k<3; k++){
                    myImageData.data[(y*size.x+x)*4+k] = norm;
                }
                myImageData.data[(y*size.x+x)*4+3] =  255;
            
            }
        }
        ctx.putImageData(myImageData, 0, 0);
    }
    reader.readAsText(file,"UTF-8");
}


    
var xmldom;
var d;

function xmlfind(xpath){
    var res = [];
    var xres = xmldom.evaluate(xpath,xmldom,
        function(e){
              if(e=='spm') return 'http://www.nanoscan.ch/SPM'
        },5,null);
    var a = xres.iterateNext();
    while(a){
        res.push(a);
        a = xres.iterateNext();
    }
    return res;
}

 function decodeBase64(s, buff) {
    var e={},b=0,c,l=0;
    var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for(var i=0; i<64; i++){
        e[A.charAt(i)] = i;
    }
    var r = new Uint8Array(buff);
    var j=0;
    for(var x=0; x<s.length; x++){
        if(s.charAt(x)=="\r" || s.charAt(x)=="\n"){
        }else{
            c = e[s.charAt(x)];
            b = (b<<6)+c;
            l += 6;
            while(l>=8){
                l -= 8;
                r[j] = ((b>>>l)&0xff);
                j++;
            }
        }
    }
};

function readxml() {
   console.log("Read XML");
   var file = xmlfile.files[0];
   var reader = new FileReader();
   reader.onloadend = function(evt) {
        xmldom = new DOMParser().parseFromString(evt.target.result, "text/xml");
        var r = xmlfind('/spm:scan//spm:direction/spm:vector/spm:contents/spm:name/spm:v')
        $('#direction').find('option').remove();
        for(var i=0; i<r.length; i++){
            var name = r[i].innerHTML;
            $('#direction').append($('<option>', {value: name, text: name}));
        }
        readchannels();
   }
   reader.readAsText(file,"UTF-8");
}

var data;

function readchannel() {
    var size = {
        x: xmlfind('/spm:scan/spm:vector/spm:contents/spm:size/spm:contents/spm:fast_axis/spm:v')[0].textContent,
        y: xmlfind('/spm:scan/spm:vector/spm:contents/spm:size/spm:contents/spm:slow_axis/spm:v')[0].textContent
    };
    var direction = $('#direction').find(":selected").text();
    var channel =  $('#channel').find(":selected").text();
    var xpath = '/spm:scan//spm:direction/spm:vector/spm:contents/spm:name[spm:v=\''+direction+'\']/../spm:channel//spm:contents/spm:name[spm:v=\''+channel+'\']/../spm:data/spm:v';
    var r = xmlfind(xpath);
    data = new ArrayBuffer(4*size.x*size.y);
    decodeBase64(r[0].textContent, data);
    var Fdata = new DataView(data);
    var dmin = Fdata.getFloat32(0, true);
    var dmax = Fdata.getFloat32(0, true);
    var s = 0;
    var s2 = 0;
    var N = size.x*size.y;
    for(var i=0; i<N; i++){
        var val = Fdata.getFloat32(4*i, true);
        s += val;
        s2 += val*val;
        if(val < dmin) dmin = val;
        if(val > dmax) dmax = val;
    } 
    var std = Math.sqrt(s2/N-(s/N)*(s/N));
    var c = $('#xmlcanvas')[0];
    c.width = size.x;
    c.height = size.y;
    var ctx = c.getContext("2d");
    var myImageData = ctx.createImageData(size.x, size.y);
    for(var y=0; y<size.y; y++){
        for(var x=0; x<size.x; x++){
            var value = Fdata.getFloat32(4*(size.x*y+x), true)
            var norm = Math.round(255*(value-dmin)/(dmax-dmin));
            for(var i=0; i<3; i++){
                myImageData.data[(y*size.x+x)*4+i] = norm;
            }
            myImageData.data[(y*size.x+x)*4+3] = 255;
        
        }
    }
    ctx.putImageData(myImageData, 0, 0);
    console.log("Data: max: "+dmax.toString()+" , min: "+dmin.toString());
}

function hot(value){
    A = 0.365079;
    B = 0.7460321;
    var r = 0.0416+(value-A)*(1-0.0416)/(1-A);
    var g = (value>B)?1:((value>A)?(value-A)/(B-A):0);
    var b = (value>B)?(value-B)/(1-B):0;
    return [r,g,b];
}

function readchannels() {
    var direction = $('#direction').find(":selected").text();
    console.log("Reading "+direction+" channels");
    var xpath = '/spm:scan//spm:direction/spm:vector/spm:contents/spm:name[spm:v=\''+direction+'\']/../spm:channel//spm:contents/spm:name/spm:v';
    var r = xmlfind(xpath);
    $('#channel').find('option').remove();
    for(var i=0; i<r.length; i++){
        var name = r[i].innerHTML;
        $('#channel').append($('<option>',{value:name,text:name}));
    }
    readchannel();
}

function convert() {
 var file = xmlfile.files[0];
   var reader = new FileReader();
   reader.onloadend = function(evt) {
        xmldom = new DOMParser().parseFromString(evt.target.result, "text/xml");
        var size = {
            x: xmlfind('/spm:scan/spm:vector/spm:contents/spm:size/spm:contents/spm:fast_axis/spm:v')[0].textContent,
            y: xmlfind('/spm:scan/spm:vector/spm:contents/spm:size/spm:contents/spm:slow_axis/spm:v')[0].textContent
        };
        var direction = $('#direction').find(":selected").text();
        var channel =  $('#channel').find(":selected").text();
        var xpath = '/spm:scan//spm:direction/spm:vector/spm:contents/spm:name[spm:v=\''+direction+'\']/../spm:channel//spm:contents/spm:name[spm:v=\''+channel+'\']/../spm:data/spm:v';
        var r = xmlfind(xpath);
        r[0].innerHTML = b64s;
        var oSerializer = new XMLSerializer();
        var newxml = oSerializer.serializeToString(xmldom);
        var blob = new Blob([newxml], {type: "text/xml"});
        saveAs(blob, xmlfile.files[0].name.replace(/\.xml$/g,"_edit.xml"), ".xml");
   }
   reader.readAsText(file,"UTF-8");
}