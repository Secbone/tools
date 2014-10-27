(function(){
    var Convert = {
        encode: {
            string: function(data){
                return data;
            },
            hex: function(data){
                var val = '';
                for(var i=0; i<data.length; i++){
                    val += Convert.private._char2Number(data.charCodeAt(i), 16);
                }
                return val;
            },
            base64: function(data){
                return Convert.private._base64Encode(data);
            }
        },
        decode: {
            string: function(data){
                return data;
            },
            //TODO
            hex: function(data){
                return data;
            },
            base64: function(data){
                return Convert.private._base64Decode(data);
            }
        },
        private: {
            _base64Chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

            //TODO
            _char2Number: function(char, num){
                return char.toString(num);
            },
            //TODO
            _Number2Char: function(char, num){

            },
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
            // has problem !
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
        console.log(selector+":"+value);
        //way.set("input", value, {silent: true});
        var string = Convert.decode[selector](value);
        way.set("string", string, {silent: true});
        for(var type in Convert.encode){
            if(type != 'string' && type != selector){
                way.set(type, Convert.encode[type](string), {silent: true});
            }
        }
    })
})();
