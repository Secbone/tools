(function(){
    var Convert = {
        encode: {
            string: function(data){
                return data;
            },
            hex: function(data){
                var val = '';
                for(var i=0; i<data.length; i++){
                    val += data.charCodeAt(i).toString(16);
                }
                return '0x'+val.toUpperCase();
            },
            url: function(data){
                var result = '';
                for(var i=0; i<data.length; i++){
                    result += "%"+data.charCodeAt(i).toString(16);
                }
                return result.toUpperCase();
            },
            sql: function(data){
                var result = '';
                for(var i=0; i<data.length; i++){
                    result += data.charCodeAt(i).toString(16)+"00";
                }
                return "0x"+result.toUpperCase();
            },
            base64: function(data){
                return Convert.private._base64Encode(data);
            },
            asc: function(data){
                var arr = [];
                for(var i=0; i<data.length; i++){
                    arr.push(data.charCodeAt(i));
                }
                return arr.join(" ");
            }
        },
        decode: {
            string: function(data){
                return data;
            },
            //TODO  Only start with '0x' or '\u' in english
            hex: function(data){
                var string = String(data);
                var hexStr = "";
                if(string.slice(0,2) == '0x'){
                    string = string.replace(/0x/g, '');
                    for(var i=0; i<string.length/2; i++){
                        hexStr += "%u00"+string.slice(i*2, i*2+2);
                    }
                }else if(string.slice(0,2) == '\\u'){
                    hexStr = string.replace(/\\/g, '%');
                }
                return unescape(hexStr);
            },
            url: function(data){
                var string = String(data).replace(/%/g, '%u00');
                return unescape(string);

            },
            //TODO  I think it has bug!
            sql: function(data){
                var hexStr = String(data).replace(/0x/g, '00');
                hexStr = hexStr.slice(0, -2).replace(/00/g, '%u00');
                return unescape(hexStr);
            },
            base64: function(data){
                return Convert.private._base64Decode(data);
            },
            asc: function(data){
                var result = "";
                var string = String(data).replace(/\,/g, ' ');
                var arr = string.split(' ');
                for(var i in arr){
                    result += String.fromCharCode(arr[i]);
                }
                return result;
            }
        },
        private: {
            _base64Chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",


            _base64Encode: function(string){
                var result = '';
                var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                var i = 0;
                string = this._utf8Encode(string);
                while(i < string.length){
                    chr1 = string.charCodeAt(i++);
                    chr2 = string.charCodeAt(i++);
                    chr3 = string.charCodeAt(i++);
                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;
                    if(isNaN(chr2)){
                        enc3 = enc4 = 64;
                    }else if(isNaN(chr3)){
                        enc4 = 64;
                    }
                    result = result +
                    this._base64Chars.charAt(enc1) + this._base64Chars.charAt(enc2) +
                    this._base64Chars.charAt(enc3) + this._base64Chars.charAt(enc4);
                }
                return result;
            },
            _base64Decode: function(string){
                var result = "";
                var chr1, chr2, chr3;
                var enc1, enc2, enc3, enc4;
                var i = 0;
                string = String(string).replace(/[^A-Za-z0-9\+\/\=]/g, "");
                while(i < string.length){
                    enc1 = this._base64Chars.indexOf(string.charAt(i++));
                    enc2 = this._base64Chars.indexOf(string.charAt(i++));
                    enc3 = this._base64Chars.indexOf(string.charAt(i++));
                    enc4 = this._base64Chars.indexOf(string.charAt(i++));
                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;
                    result = result + String.fromCharCode(chr1);
                    if(enc3 != 64){
                        result = result + String.fromCharCode(chr2);
                    }
                    if(enc4 != 64){
                        result = result + String.fromCharCode(chr3);
                    }
                }
                result = this._utf8Decode(result);
                return result;
            },
            _utf8Encode: function(string){
                string = string.replace(/\r\n/g,"\n");
                var utftext = "";
                for(var n=0; n<string.length; n++){
                    var c = string.charCodeAt(n);
                    if(c < 128){
                        utftext += String.fromCharCode(c);
                    }else if((c > 127) && (c < 2048)){
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }else{
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                }
                return utftext;
            },
            _utf8Decode: function(utftext){
                var string = "";
                var i = 0;
                var c = c1 = c2 = 0;
                while( i < utftext.length ){
                    c = utftext.charCodeAt(i);
                    if(c < 128){
                        string += String.fromCharCode(c);
                        i++;
                    }else if((c > 191) && (c < 224)){
                        c2 = utftext.charCodeAt(i+1);
                        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                        i += 2;
                    }else{
                        c2 = utftext.charCodeAt(i+1);
                        c3 = utftext.charCodeAt(i+2);
                        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                        i += 3;
                    }
                }
                return string;
            },
        }
    }
    way.watchAll(function(selector, value){
        //console.log(selector+":"+value);
        //way.set("input", value, {silent: true});
        if(!value) return way.remove(null, {persistent: true, silent: true});
        var string = Convert.decode[selector](value);
        way.set("string", string, {silent: true});
        for(var type in Convert.encode){
            if(type != 'string' && type != selector){
                way.set(type, Convert.encode[type](string), {silent: true});
            }
        }
    });
    //TODO
    //set focus
})();
