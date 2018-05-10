/**
 * 
 */

APIConfig = {
    key: '1F6D701272402D1E7D8D316CCE519123',
    root: 'http://api.shipxy.com/',
    shipserver: 'http://api.shipxy.com/apicall/index',
    tide: 'http://chaoxi.shipxy.com/tide',
    flashver: 1
};

(function () {

    RootPath = APIConfig.root;
    MapKey = APIConfig.key; //shipxyMap的key，用于验证Flash地图是否可以正常使用
    TideServer = APIConfig.tide; //潮汐服务地址
    flashPath = APIConfig.root + 'apiresource/1.3/shipxyAPI.swf?v=' + APIConfig.flashver;

    var isen = (navigator.userLanguage || navigator.language).toLowerCase().indexOf('cn') == -1;
    var version = 2; //shipServer版本号
    var encoding = 0; //编码，0：Base64，1：JSON
    //继承原型，propertys：定义在子类原型上的新属性/方法集合
    var inheritPrototype = function (subClass, superClass, propertys) {
        function F() { };
        F.prototype = superClass.prototype;
        var prototype = new F();
        prototype.constructor = subClass;
        if (propertys) {
            for (var k in propertys) {
                if (propertys.hasOwnProperty(k)) prototype[k] = propertys[k];
            }
        }
        subClass.prototype = prototype;
    };
    /*********XSS--跨域脚本请求***********/
    var xssHttpRequestCount = 0; //累计请求的次数
    var XssHttpRequest = function (url, options) {
        if (this instanceof XssHttpRequest) {
            this.options = options || {}; //请求选项，比如成功与失败的回调函数
            this.options.timeout = this.options.hasOwnProperty('timeout') ? this.options.timeout : 0; //超时时长，默认0秒，不做超时处理
            this.options.callback = this.options.hasOwnProperty('callback') ? this.options.callback : 'callback';
            this.requestID = this.options.callback + '_' + (++xssHttpRequestCount); //本次请求id，以区分不同的请求
            this.serverCallback = 'shipxyAPI.' + this.requestID + '_callback'; //本次请求服务器返回的js函数名
            this.url = url + (url.indexOf('?') == -1 ? '?' : '&') + this.options.callback + '=' + this.serverCallback; //请求路径
            this.scriptElement = null; //脚本元素
            this.timeoutWatcher = 0; //超时计时器
        } else {
            return new XssHttpRequest(url, options);
        }
    };
    //XSS--跨域脚本请求的方法
    XssHttpRequest.prototype = {
        //发出请求
        send: function () {
            try {
                this.scriptElement = document.createElement('script'); //创建脚本元素
                this.scriptElement.setAttribute('id', this.requestID);
                this.scriptElement.setAttribute('type', 'text/javascript');
                var that = this;
                if (this.options.timeout > 0) {
                    //超时计时器
                    this.timeoutWatcher = setTimeout(function () {
                        that.abort();
                        if (that.options.error) {
                            that.options.error.call(that);
                        }
                    }, this.options.timeout);
                }
                //请求成功完毕，服务器返回的js函数，参数中就包含了请求所得到的数据内容
                shipxyAPI[this.serverCallback.substr(10)] = function (data) {
                    if (that.options.success) {
                        that.options.success.call(that, data);
                    }
                    that.abort();
                }
                this.scriptElement.setAttribute('src', this.url); //设置路径，开始读取脚本文件，此后服务器会返回一个js函数
                document.getElementsByTagName('head')[0].appendChild(this.scriptElement); //脚本元素添加到head元素中
            } catch (err) {
                that.abort();
                if (that.options.error) {
                    that.options.error.call(that);
                }
            }
        },
        //销毁请求
        abort: function () {
            clearTimeout(this.timeoutWatcher);
            this.timeoutWatcher = 0;
            this.scriptElement.parentNode.removeChild(this.scriptElement);
            this.scriptElement = null;
            delete shipxyAPI[this.serverCallback.substr(10)];
        }
    };
    /*
    * JS版base64编解码算法。示例:
    * b64 = base64.encode64(data);
    * data = base64.decode64(b64);
    */
    var base64 = {
        encodeChars: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"],
        decodeChars: [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1],
        //编码
        encode64: function (str) {
            var out, i, j, len;
            var c1, c2, c3;
            len = str.length;
            i = j = 0;
            out = [];
            while (i < len) {
                c1 = str.charCodeAt(i++) & 0xff;
                if (i == len) {
                    out[j++] = this.encodeChars[c1 >> 2];
                    out[j++] = this.encodeChars[(c1 & 0x3) << 4];
                    out[j++] = "==";
                    break;
                }
                c2 = str.charCodeAt(i++) & 0xff;
                if (i == len) {
                    out[j++] = this.encodeChars[c1 >> 2];
                    out[j++] = this.encodeChars[((c1 & 0x03) << 4) | ((c2 & 0xf0) >> 4)];
                    out[j++] = this.encodeChars[(c2 & 0x0f) << 2];
                    out[j++] = "=";
                    break;
                }
                c3 = str.charCodeAt(i++) & 0xff;
                out[j++] = this.encodeChars[c1 >> 2];
                out[j++] = this.encodeChars[((c1 & 0x03) << 4) | ((c2 & 0xf0) >> 4)];
                out[j++] = this.encodeChars[((c2 & 0x0f) << 2) | ((c3 & 0xc0) >> 6)];
                out[j++] = this.encodeChars[c3 & 0x3f];
            }
            return out.join('');
        },
        //解码
        decode64: function (str) {
            var c1, c2, c3, c4;
            var i, j, len, out;
            len = str.length;
            i = j = 0;
            out = [];
            while (i < len) {
                do {
                    c1 = this.decodeChars[str.charCodeAt(i++) & 0xff];
                } while (i < len && c1 == -1);
                if (c1 == -1) break;
                do {
                    c2 = this.decodeChars[str.charCodeAt(i++) & 0xff];
                } while (i < len && c2 == -1);
                if (c2 == -1) break;
                out[j++] = String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
                do {
                    c3 = str.charCodeAt(i++) & 0xff;
                    if (c3 == 61) return out.join('');
                    c3 = this.decodeChars[c3];
                } while (i < len && c3 == -1);
                if (c3 == -1) break;
                out[j++] = String.fromCharCode(((c2 & 0x0f) << 4) | ((c3 & 0x3c) >> 2));
                do {
                    c4 = str.charCodeAt(i++) & 0xff;
                    if (c4 == 61) return out.join('');
                    c4 = this.decodeChars[c4];
                } while (i < len && c4 == -1);
                if (c4 == -1) break;
                out[j++] = String.fromCharCode(((c3 & 0x03) << 6) | c4);
            }
            return out.join('');
        },
        //UTF-16转UTF-8，用于正确编码汉字
        utf16to8: function (str) {
            var out, i, len, c;
            out = "";
            len = str.length;
            for (i = 0; i < len; i++) {
                c = str.charCodeAt(i);
                if ((c >= 0x0001) && (c <= 0x007F)) {
                    out += str.charAt(i);
                } else if (c > 0x07FF) {
                    out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
                    out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
                    out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
                } else {
                    out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
                    out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
                }
            }
            return out;
        },
        //UTF-8转UTF-16，用于正确解码汉字
        utf8to16: function (str) {
            var out, i, len, c;
            var char2, char3;
            out = "";
            len = str.length;
            i = 0;
            while (i < len) {
                c = str.charCodeAt(i++);
                switch (c >> 4) {
                    case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                        // 0xxxxxxx
                        out += str.charAt(i - 1);
                        break;
                    case 12: case 13:
                        // 110x xxxx   10xx xxxx
                        char2 = str.charCodeAt(i++);
                        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                        break;
                    case 14:
                        // 1110 xxxx  10xx xxxx  10xx xxxx
                        char2 = str.charCodeAt(i++);
                        char3 = str.charCodeAt(i++);
                        out += String.fromCharCode(((c & 0x0F) << 12) |
                           ((char2 & 0x3F) << 6) |
                           ((char3 & 0x3F) << 0));
                        break;
                }
            }
            return out;
        }
    };
    //二进制字节流访问
    var ByteArray = function (data, endian) {
        this.data = data || ''; //字节流源数据
        this.endian = endian || this.Endian.LITTLE; //字节编码
        this.length = this.data.length; //字节流长度
        this.position = 0; //当前指针
        this.TWOeN23 = Math.pow(2, -23);
        this.TWOeN52 = Math.pow(2, -52);
    };
    //字节编码
    ByteArray.Endian = {
        BIG: 0, //大字节编码
        LITTLE: 1//小字节编码
    };
    ByteArray.prototype = {
        //从字节流中读取带符号的字节
        readByte: function () {
            return this.data.charCodeAt(this.position++) & 0xFF;
        },
        //从字节流中读取布尔值
        readBoolean: function () {
            return this.data.charCodeAt(this.position++) & 0xFF ? true : false;
        },
        //从字节流中读取一个无符号的 16 位整数
        readUnsignedShort: function () {
            var data = this.data, pos;
            if (this.endian == ByteArray.Endian.BIG) {
                pos = (this.position += 2) - 2;
                return ((data.charCodeAt(pos) & 0xFF) << 8) | (data.charCodeAt(++pos) & 0xFF);
            } else if (this.endian == ByteArray.Endian.LITTLE) {
                pos = (this.position += 2);
                return ((data.charCodeAt(--pos) & 0xFF) << 8) | (data.charCodeAt(--pos) & 0xFF);
            }
        },
        //从字节流中读取一个带符号的 16 位整数
        readShort: function () {
            var data = this.data, pos, x;
            if (this.endian == ByteArray.Endian.BIG) {
                pos = (this.position += 2) - 2;
                x = ((data.charCodeAt(pos) & 0xFF) << 8) | (data.charCodeAt(++pos) & 0xFF);
            } else if (this.endian == ByteArray.Endian.LITTLE) {
                pos = (this.position += 2);
                x = ((data.charCodeAt(--pos) & 0xFF) << 8) | (data.charCodeAt(--pos) & 0xFF);
            }
            return (x >= 32768) ? x - 65536 : x;
        },
        //从字节流中读取一个无符号的 32 位整数
        readUnsignedInt: function () {
            var data = this.data, pos;
            if (this.endian == ByteArray.Endian.BIG) {
                pos = (this.position += 4) - 4;
                return ((data.charCodeAt(pos) & 0xFF) << 24) | ((data.charCodeAt(++pos) & 0xFF) << 16) | ((data.charCodeAt(++pos) & 0xFF) << 8) | (data.charCodeAt(++pos) & 0xFF);
            } else if (this.endian == ByteArray.Endian.LITTLE) {
                pos = (this.position += 4);
                return ((data.charCodeAt(--pos) & 0xFF) << 24) | ((data.charCodeAt(--pos) & 0xFF) << 16) | ((data.charCodeAt(--pos) & 0xFF) << 8) | (data.charCodeAt(--pos) & 0xFF);
            }
        },
        //从字节流中读取一个带符号的 32 位整数
        readInt: function () {
            var data = this.data, pos, x;
            if (this.endian == ByteArray.Endian.BIG) {
                pos = (this.position += 4) - 4;
                x = ((data.charCodeAt(pos) & 0xFF) << 24) | ((data.charCodeAt(++pos) & 0xFF) << 16) | ((data.charCodeAt(++pos) & 0xFF) << 8) | (data.charCodeAt(++pos) & 0xFF);
            } else if (this.endian == ByteArray.Endian.LITTLE) {
                pos = (this.position += 4);
                x = ((data.charCodeAt(--pos) & 0xFF) << 24) | ((data.charCodeAt(--pos) & 0xFF) << 16) | ((data.charCodeAt(--pos) & 0xFF) << 8) | (data.charCodeAt(--pos) & 0xFF);
            }
            return (x >= 2147483648) ? x - 4294967296 : x;
        },
        //从字节流中读取一个无符号的64位整数
        readUnsignedInt64: function () {
            var data = this.data, pos;
            if (this.endian == ByteArray.Endian.BIG) {
            } else if (this.endian == ByteArray.Endian.LITTLE) {
                pos = this.position;
                //低四位和
                var result = (((data.charCodeAt(pos + 3) & 0xFF) << 24) |
		        ((data.charCodeAt(pos + 2) & 0xFF) << 16) |
		        ((data.charCodeAt(pos + 1) & 0xFF) << 8) |
		        ((data.charCodeAt(pos) & 0xFF)));
                //32位表示高四位和
                var result11 = (((data.charCodeAt(pos + 7) & 0xFF) << 24) |
		        ((data.charCodeAt(pos + 6) & 0xFF) << 16) |
		        ((data.charCodeAt(pos + 5) & 0xFF) << 8) |
		        ((data.charCodeAt(pos + 4) & 0xFF)));
                this.position += 8;
                return (result11 * 65536 * 65536 + result); //高4位  低4位
            }
        },
        //从字节流中读取一个带符号的64位整数
        readInt64: function () {
            var data = this.data, pos;
            if (this.endian == ByteArray.Endian.BIG) {
            } else if (this.endian == ByteArray.Endian.LITTLE) {
                pos = this.position;
                //低四位和
                var result = (((data.charCodeAt(pos + 3) & 0xFF) << 24) |
		        ((data.charCodeAt(pos + 2) & 0xFF) << 16) |
		        ((data.charCodeAt(pos + 1) & 0xFF) << 8) |
		        ((data.charCodeAt(pos) & 0xFF)));
                //32位表示高四位和
                var result11 = (((data.charCodeAt(pos + 7) & 0xFF) << 24) |
		        ((data.charCodeAt(pos + 6) & 0xFF) << 16) |
		        ((data.charCodeAt(pos + 5) & 0xFF) << 8) |
		        ((data.charCodeAt(pos + 4) & 0xFF)));
                this.position += 8;
                var rs = (result11 * 65536 * 65536 + result); //高4位  低4位
                if (rs > 4294967296 * 2147483648 - 1) {
                    rs -= 4294967296 * 4294967296;
                }
                return rs;
            }
        },
        //从字节流中读取一个 IEEE 754 单精度（32 位）浮点数
        readFloat: function () {
            var data = this.data, pos, b1, b2, b3, b4;
            if (this.endian == ByteArray.Endian.BIG) {
                pos = (this.position += 4) - 4;
                b1 = data.charCodeAt(pos) & 0xFF;
                b2 = data.charCodeAt(++pos) & 0xFF;
                b3 = data.charCodeAt(++pos) & 0xFF;
                b4 = data.charCodeAt(++pos) & 0xFF;
            } else if (this.endian == ByteArray.Endian.LITTLE) {
                pos = (this.position += 4);
                b1 = data.charCodeAt(--pos) & 0xFF;
                b2 = data.charCodeAt(--pos) & 0xFF;
                b3 = data.charCodeAt(--pos) & 0xFF;
                b4 = data.charCodeAt(--pos) & 0xFF;
            }
            var sign = 1 - ((b1 >> 7) << 1);                   // sign = bit 0
            var exp = (((b1 << 1) & 0xFF) | (b2 >> 7)) - 127;  // exponent = bits 1..8
            var sig = ((b2 & 0x7F) << 16) | (b3 << 8) | b4;    // significand = bits 9..31
            if (sig == 0 && exp == -127)
                return 0.0;
            return sign * (1 + this.TWOeN23 * sig) * this.pow(2, exp);
        },
        //从字节流中读取一个 IEEE 754 双精度（64 位）浮点数
        readDouble: function () {
            var data = this.data, pos, b1, b2, b3, b4, b5, b6, b7, b8;
            if (this.endian == ByteArray.Endian.BIG) {
                pos = (this.position += 8) - 8;
                b1 = data.charCodeAt(pos) & 0xFF;
                b2 = data.charCodeAt(++pos) & 0xFF;
                b3 = data.charCodeAt(++pos) & 0xFF;
                b4 = data.charCodeAt(++pos) & 0xFF;
                b5 = data.charCodeAt(++pos) & 0xFF;
                b6 = data.charCodeAt(++pos) & 0xFF;
                b7 = data.charCodeAt(++pos) & 0xFF;
                b8 = data.charCodeAt(++pos) & 0xFF;
            } else if (this.endian == ByteArray.Endian.LITTLE) {
                pos = (this.position += 8);
                b1 = data.charCodeAt(--pos) & 0xFF;
                b2 = data.charCodeAt(--pos) & 0xFF;
                b3 = data.charCodeAt(--pos) & 0xFF;
                b4 = data.charCodeAt(--pos) & 0xFF;
                b5 = data.charCodeAt(--pos) & 0xFF;
                b6 = data.charCodeAt(--pos) & 0xFF;
                b7 = data.charCodeAt(--pos) & 0xFF;
                b8 = data.charCodeAt(--pos) & 0xFF;
            }
            var sign = 1 - ((b1 >> 7) << 1); // sign = bit 0
            var exp = (((b1 << 4) & 0x7FF) | (b2 >> 4)) - 1023; // exponent = bits 1..11
            var sig = (((b2 & 0xF) << 16) | (b3 << 8) | b4).toString(2) + ((b5 >> 7) ? '1' : '0') + (((b5 & 0x7F) << 24) | (b6 << 16) | (b7 << 8) | b8).toString(2); // significand = bits 12..63
            sig = parseInt(sig, 2);
            if (sig == 0 && exp == -1023)
                return 0.0;
            return sign * (1.0 + this.TWOeN52 * sig) * this.pow(2, exp);
        },
        //从字节流中读取一个 UTF-8 字符串
        readUTF: function () {
            var data = this.data;
            var len = this.readUnsignedShort();
            var str = "";
            while (len--) {
                var chr = this.readByte();
                str += String.fromCharCode(chr);
            }
            return str;
        }
    };
    //获取数据byte的第pos位的值，从0开始
    var getBit = function (bit, pos) {
        var num = bit & (1 << pos);
        if (num > 0) return 1;
        else return 0;
    };
    //写64位整数到字节数组中，小字节序
    var bit64To32 = function (value) {
        var hi32 = value / (65536 * 65536);
        var lo32 = value - hi32 * 65536 * 65536;
        return lo32;
    };

    //船舶类型代码表
    var shipTypeArray = isen ? [
        "Pilot vessel",
        "Search and rescue vessel",
        "Tug",
        "Port tender",
        "Vessel with anti-pollution facilities or equipment",
        "Law enforcement vessel",
        "Spare-for assignments to local vessel",
        "Spare-for assignments to local vessel",
        "Medical transport",
        "Ship according to Resolution No 18(Mob-83)",
        "Fishing",
        "Towing",
        "Towing and length>200m or breadth>25m",
        "Engaged in dredging or underwater operations",
        "Engaged in diving operations",
        "Enagged in military operations",
        "Sailing",
        "Pleasure craft",
        "WIG",
        "HSC",
        "Passenger ship",
        "Cargo ship",
        "Tanker",
        "Other type of ship"
    ] : [
        "引航船", "搜救船", "拖轮",
        "港口供应船", "其他", //"装有防污装置和设备的船舶",
        "执法艇", "其他", //"备用-用于当地船舶的任务分配",
        "其他", //"备用-用于当地船舶的任务分配",
        "医疗船", "其他", //"符合18号决议(Mob-83)的船舶",
        "捕捞", "拖引", "拖引", //"拖引并且船长>200m或船宽>25m",
        "疏浚或水下作业", "潜水作业", "参与军事行动", "帆船航行",
        "娱乐船", "地效应船", "高速船", "客船", "货船", "油轮", "其他"
    ];
    var cargoTypeArray = isen ? ['Danger A', 'Danger B', 'Danger C', 'Danger D'] : ['A 类危险品', 'B 类危险品', 'C 类危险品', 'D 类危险品'];
    var shipStatus = isen ? [
        "Under way using engine",
        "At anchor",
        "Not under command",
        "Restricted manoeuvrability",
        "Constrained by her draught",
        "Moored",
        "Aground",
        "Engaged in Fishing",
        "Under way sailing"
    ]
    : ["在航(主机推动)", "锚泊", "失控", "操作受限", "吃水受限", "靠泊", "搁浅", "捕捞作业", "靠船帆提供动力"];
    var countryArray = { "201": "ALB", "202": "AND", "203": "AUT", "204": "AZS", "205": "BEL", "206": "BLR", "207": "BGR", "208": "VAT", "209": "CYP", "210": "CYP", "211": "DEU", "212": "CYP", "213": "GEO", "214": "MDA", "215": "MLT", "216": "ARM", "218": "DEU", "219": "DNK", "220": "DNK", "224": "ESP", "225": "ESP", "226": "FRA", "227": "FRA", "228": "FRA", "230": "FIN", "231": "FRO", "232": "GBR", "233": "GBR", "234": "GBR", "235": "GBR", "236": "GIB", "237": "GRC", "238": "HRV", "239": "GRC", "240": "GRC", "242": "MAR", "243": "HUN", "244": "NLD", "245": "NLD", "246": "NLD", "247": "ITA", "248": "MLT", "249": "MLT", "250": "IRL", "251": "ISL", "252": "LIE", "253": "LUX", "254": "MCO", "255": "MDR", "256": "MLT", "257": "NOR", "258": "NOR", "259": "NOR", "261": "POL", "262": "MNE", "263": "PRT", "264": "ROU", "265": "SWE", "266": "SWE", "267": "SVK", "268": "SMR", "269": "SWZ", "270": "CZE", "271": "TUR", "272": "UKR", "273": "RUS", "274": "MKD", "275": "LVA", "276": "EST", "277": "LTU", "278": "SVN", "279": "SRB", "301": "AIA", "303": "USA", "304": "ATG", "305": "ATG", "306": "ANT", "307": "ABW", "308": "BHS", "309": "BHS", "310": "BMU", "311": "BHS", "312": "BLZ", "314": "BRB", "316": "CAN", "319": "CYM", "321": "CRI", "323": "CUB", "325": "DOM", "327": "DOM", "329": "GLP", "330": "GRD", "331": "GRL", "332": "GTM", "334": "HND", "336": "HTI", "338": "USA", "339": "JAM", "341": "KNA", "343": "LCA", "345": "MEX", "347": "MTQ", "348": "MSR", "350": "NIC", "351": "PAN", "352": "PAN", "353": "PAN", "354": "PAN", "358": "PRI", "359": "SLV", "361": "SPM", "362": "TTO", "364": "TCA", "366": "USA", "367": "USA", "368": "USA", "369": "USA", "371": "PAN", "372": "PAN", "375": "VCT", "376": "VCT", "377": "VCT", "378": "VGB", "379": "VGB", "401": "AFG", "403": "SAU", "405": "BGD", "408": "BHR", "410": "BTN", "412": "CHN", "413": "CHN", "414": "CHN", "416": "TWN", "417": "LKA", "419": "IND", "422": "IRN", "423": "AZE", "425": "IRQ", "428": "ISR", "431": "JPN", "432": "JPN", "434": "TKM", "436": "KAZ", "437": "UZB", "438": "JOR", "440": "KOR", "441": "KOR", "443": "PSE", "445": "PRK", "447": "KWT", "450": "LBN", "451": "KGZ", "453": "MAC", "455": "MDV", "457": "MNG", "459": "NPL", "461": "OMN", "463": "PAK", "466": "QAT", "468": "SYR", "470": "ARE", "473": "YEM", "475": "YEM", "477": "HKG", "478": "BIH", "501": "ADL", "503": "AUS", "506": "MMR", "508": "BRN", "510": "FSM", "511": "PLW", "512": "NZL", "514": "KHM", "515": "KHM", "516": "CXR", "518": "COK", "520": "FJI", "523": "CCK", "525": "IDN", "529": "KIR", "531": "LAO", "533": "MYS", "536": "MNP", "538": "MHL", "540": "NCL", "542": "NIU", "544": "NRU", "546": "PYF", "548": "PHL", "553": "PNG", "555": "PCN", "557": "SLB", "559": "ASM", "561": "WSM", "563": "SGP", "564": "SGP", "565": "SGP", "567": "THA", "570": "TON", "572": "TUV", "574": "VNM", "576": "VUT", "578": "WLF", "601": "ZAF", "603": "AGO", "605": "DZA", "607": "ATF", "608": "ASL", "609": "BDI", "610": "BEN", "611": "BWA", "612": "CAF", "613": "CMR", "615": "COG", "616": "COM", "617": "CPV", "618": "ATF", "619": "CIV", "621": "DJI", "622": "EGY", "624": "ETH", "625": "ERI", "626": "GAB", "627": "GHA", "629": "GMB", "630": "GNB", "631": "GNQ", "632": "GIN", "633": "BFA", "634": "KEN", "635": "ATF", "636": "LBR", "637": "LBR", "642": "LBY", "644": "LSO", "645": "MUS", "647": "MDG", "649": "MLI", "650": "MOZ", "654": "MRT", "655": "MWI", "656": "NER", "657": "NGA", "659": "NAM", "660": "REU", "661": "RWA", "662": "SDN", "663": "SEN", "664": "SYC", "665": "SHN", "666": "SOM", "667": "SLE", "668": "STP", "669": "SWZ", "670": "TCD", "671": "TGO", "672": "TUN", "674": "TZA", "675": "UGA", "676": "COG", "677": "TZA", "678": "ZMB", "679": "ZWE", "701": "ARG", "710": "BRA", "720": "BOL", "725": "CHL", "730": "COL", "735": "ECU", "740": "FLK", "745": "GIN", "750": "GUY", "755": "PRY", "760": "PER", "765": "SUR", "770": "URY", "775": "VEN" };
    //shipxyAPI对象
    shipxyAPI = {
        name: 'shipxyAPI',
        //shipxyAPI key
        key: MapKey,
        //API管理密码，写授权码
        password: '',
        //船舶数据结构
        Ship: function () {
            if (this instanceof shipxyAPI.Ship) {
                this.shipId = '';
                this.MMSI = '';
                this.IMO = '';
                this.name = '';
                this.callsign = '';
                this.type = -1;
                this.status = -1;
                this.length = -1;
                this.beam = -1;
                this.left = -1;
                this.trail = -1;
                this.draught = -1;
                this.country = ''; //国籍
                this.cargoType = ''; //货物类型
                this.lng = 0;
                this.lat = 0;
                this.heading = 0;
                this.course = 0;
                this.speed = -1;
                this.rot = -1;
                this.dest = '';
                this.eta = '';
                this.lastTime = 0;
            } else {
                return new shipxyAPI.Ship();
            }
        },
        //区域范围数据结构
        Region: function () {
            if (this instanceof shipxyAPI.Region) {
                this.name = '';
                this.data = null;
            } else {
                return new shipxyAPI.Region();
            }
        },
        //船队分组数据结构
        Group: function () {
            if (this instanceof shipxyAPI.Group) {
                this.name = '';
                this.color = '#ffff00';
                this.data = [];
            } else {
                return new shipxyAPI.Group();
            }
        },
        //轨迹数据结构
        Track: function (shipId, startTime, endTime) {
            if (this instanceof shipxyAPI.Track) {
                if (!shipId || !startTime || !endTime) {
                    throw new Error(isen ? 'param error' : "shipxyAPI.Track构造方法参数错误，三个参数都不能为空");
                }
                if (typeof shipId != 'string' || typeof startTime != 'number' || typeof endTime != 'number') {
                    throw new Error(isen ? 'param error' : "shipxyAPI.Track构造方法参数类型错误，第一个参数必须为字符串，第二、三个参数必须为数值");
                }
                this.shipId = shipId;
                this.startTime = startTime || 0;
                this.endTime = endTime || 0;
                this.trackId = 'track_' + shipId + '_' + startTime + '_' + endTime; //轨迹id
                this.data = null;
            } else {
                return new shipxyAPI.Track(shipId, startTime, endTime);
            }
        },
        //船舶数据查询类
        Ships: function (condition, type) {
            if (this instanceof shipxyAPI.Ships) {
                this.data = null;
                this.condition = condition;
                this.type = type;
                this.scode = 0; //数据版本号
            } else {
                return new shipxyAPI.Ships(condition, type);
            }
        },
        //自动更新船舶类
        AutoShips: function (condition, type) {
            if (this instanceof shipxyAPI.AutoShips) {
                shipxyAPI.Ships.call(this, condition, type); //继承于Ships
                this.interval = 30; //30s
                this.timer = 0; //当前计时器
            } else {
                return new shipxyAPI.AutoShips(condition, type);
            }
        },
        //查询、筛选类
        Search: function () {
            if (this instanceof shipxyAPI.Search) {
                this.data = null;
            } else {
                return new shipxyAPI.Search();
            }
        },
        //历史轨迹查询类
        Tracks: function () {
            if (this instanceof shipxyAPI.Tracks) {
                this.data = null;
            } else {
                return new shipxyAPI.Tracks();
            }
        },
        //船队类
        Fleet: function (initCallback) {
            if (this instanceof shipxyAPI.Fleet) {
                this.data = [];
                this.version = 0; //船队版本号
                getFleet.call(this, initCallback); //初始化获取船队列表
            } else {
                return new shipxyAPI.Fleet(initCallback);
            }
        },
        //挂靠港历史查询类
        //船舶挂靠历史
        PortOfCallByShip: function () {
            if (this instanceof shipxyAPI.PortOfCallByShip) {
                this.data = null;
            } else {
                return new shipxyAPI.PortOfCallByShip();
            }
        },
        //指定港口挂靠
        PortOfCallByPort: function () {
            if (this instanceof shipxyAPI.PortOfCallByPort) {
                this.data = null;
            } else {
                return new shipxyAPI.PortOfCallByPort();
            }
        },
        //船舶挂靠指定港口
        PortOfCallByShipPort: function () {
            if (this instanceof shipxyAPI.PortOfCallByShipPort) {
                this.data = null;
            } else {
                return new shipxyAPI.PortOfCallByShipPort();
            }
        },
        //获取船舶当前状态
        ShipStatus: function () {
            if (this instanceof shipxyAPI.ShipStatus) {
                this.data = null;
            } else {
                return new shipxyAPI.ShipStatus();
            }
        },
        //获取船舶档案
        ShipParticular: function () {
            if (this instanceof shipxyAPI.ShipParticular) {
                this.data = null;
            } else {
                return new shipxyAPI.ShipParticular();
            }
        },
        //登录
        login: function (password, callback) {
            if (!password) return;
            var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=2007&wk=' + password;
            var that = this;
            var request = new XssHttpRequest(url, {
                callback: 'jsf',
                success: function (data) {
                    var result = parse.parseStatus(data), status = result.status;
                    if (status == 0) {
                        that.password = password;
                    }
                    callback.call(that, analyseStatus(status));
                }, error: function () {
                    callback.call(that, 100);
                }
            });
            request.send();
        },
        //修改密码
        modifyPassword: function (newPassword, callback) {
            if (!newPassword) return;
            var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=2008&wk=' + this.password + '&nwk=' + newPassword;
            var that = this;
            var request = new XssHttpRequest(url, {
                callback: 'jsf',
                success: function (data) {
                    var result = parse.parseStatus(data), status = result.status;
                    if (status == 0) {
                        that.password = newPassword;
                    }
                    callback.call(that, analyseStatus(status));
                }, error: function () {
                    callback.call(that, 100);
                }
            });
            request.send();
        }
    };
    //船队分组的原型方法
    shipxyAPI.Group.prototype = {
        //获取分组中的所有船舶的ID列表
        getShipIds: function () {
            var ids = [];
            if (this.data && this.data.length > 0) {
                for (var i = 0, len = this.data.length; i < len; i++) {
                    ids.push(this.data[i].shipId);
                }
            }
            return ids;
        },
        //获取分组中的指定船舶
        getShip: function (shipId) {
            if (!shipId) throw new Error(isen ? 'param need a mmsi' : 'getShip方法参数错误，不能为空，必须指定为一条船的Id');
            var ship, d = this.data, l = d.length;
            while (l--) {
                ship = d[l];
                if (ship.shipId == shipId) return ship;
            }
            return null;
        }
    };
    shipxyAPI.Ships.INIT_SHIPID = 0; //shipId查询
    shipxyAPI.Ships.INIT_REGION = 1; //区域查询
    shipxyAPI.Ships.INIT_FLEET = 2; //船队查询

    //获取国家三位字符简称
    var getShipCountry = function (mmsi) {
        if (!mmsi || mmsi.lenght < 3) return '';
        //取前三位 mmsi
        var ccc = parseInt(mmsi.substr(0, 3));
        if (ccc == 0 || isNaN(ccc))
            return '';
        return countryArray[ccc] || '';
    };
    //船舶状态
    var getNaviStatus = function (t) {
        if (t >= 0 && t <= 8) {
            return shipStatus[t];
        }
        return '';
    };
    //船舶类型
    var getShipType = function (t) {
        if (t < 10 || t > 100) return '';
        var num_10 = Math.floor(t / 10);
        var num_1 = t % 10;
        if (num_10 == 5) {
            return shipTypeArray[num_1];
        } else if (num_10 == 3) {
            if (num_1 >= 0 && num_1 <= 7) {
                return shipTypeArray[num_1 + 10];
            }
            return "";
        } else {
            switch (num_10) {
                case 2: return shipTypeArray[18];
                case 4: return shipTypeArray[19];
                case 6: return shipTypeArray[20];
                case 7: return shipTypeArray[21];
                case 8: return shipTypeArray[22];
                case 9: return shipTypeArray[23];
                default: return "";
            }
        }
        return "";
    };
    //获取货物的类型
    var getCargoType = function (t) {
        if (t < 10 || t > 100) return '';
        var num_10 = Math.floor(t / 10);
        var num_1 = t % 10;
        if (num_10 == 5) {
            return "";
        } else if (num_10 == 3) {
            return "";
        } else {
            switch (num_10) {
                case 2:
                case 4:
                case 6:
                case 7:
                case 8:
                case 9:
                    return cargoTypeArray[num_1 - 1] || '';
                default: return "";
            }
        }
        return "";
    };
    var analyseStatus = function (status) {
    	console.log("status");
        switch (status) {
            case 0: //成功
            	console.log("0");
                return 0;
            case 6: //Key过期
            	console.log("1");
                return 1;
            case 7: //账号被锁定  账号不存在
            case 9:
            	console.log("2");
                return 2;
            case 14: //使用的域名错误	来自不明的域名访问数据，拒绝返回数据。
            	console.log("3");
            	return 3;
            case 12: //接口请求的数据量过大	请求的数据量过大，服务器拒绝返回数据。
            case 15:
            	console.log("4");
            	return 4;
            case 16: //请求非法区域	请求的区域超出非法区域，服务器拒绝返回数据。
            	console.log("5");
            	return 5;
            case 17: //密码错误
            	console.log("6");
            	return 6;
            default:
                break;
        }
        console.log("100");
        return 100; //其他错误
    };
    //解析
    var parse = {
        //解析船舶详细数据
        parseShip: function (ba) {
            var ship = new shipxyAPI.Ship(); //船舶数据
            ship.shipId = '' + ba.readUnsignedInt64(); //  8位无符号整型   
            ba.readUnsignedInt();
            ship.MMSI = "" + ba.readUnsignedInt();
            ship.country = getShipCountry(ship.MMSI); //国籍
            var shipType = ba.readUnsignedShort();
            ship.type = getShipType(shipType);
            ship.cargoType = getCargoType(shipType); //货物类型
            var IMO = ba.readUnsignedInt(); // imo 为0表示为空
            ship.IMO = (0 == IMO || IMO == 2147483647) ? "" : IMO.toString();
            ship.name = ba.readUTF();
            ship.callsign = ba.readUTF();
            ship.length = ba.readUnsignedShort() / 10.0;
            ship.length = ship.length > 511 ? 511 : ship.length;
            ship.beam = ba.readUnsignedShort() / 10.0;
            ship.left = ba.readUnsignedShort() / 10.0;
            ship.trail = ba.readUnsignedShort() / 10.0; //单位米
            ship.draught = ba.readUnsignedShort() / 1000.0;;
            ship.dest = ba.readUTF(); //目的地	string
            var month = String(ba.readByte()); //整数（byte）	1
            var day = String(ba.readByte()); //整数（byte）	1
            var hour = String(ba.readByte()); //整数（byte）	1
            var minute = String(ba.readByte()); //整数（byte）	1
            var eta; 						//字符串格式的eat：6.5 08:00
            if (month == "0" && day == "0" && hour == "0" && minute == "0") {
                eta = "";
            } else {
                if (hour.length == 1) hour = "0" + hour;
                if (minute.length == 1) minute = "0" + minute;
                eta = month + "." + day + " " + hour + ":" + minute;
            }
            ship.eta = eta;
            ship.status = getNaviStatus(ba.readUnsignedShort());
            ship.lat = ba.readInt() / 1000000; //纬度,百万分之一度，没查到则返回非法值[-90000000,9000000]	整数(int32)	4					
            ship.lng = ba.readInt() / 1000000; //经度,百万分之一度，没查到则返回非法值[-180000000,18000000]	整数(int32)	4
            ship.heading = ba.readUnsignedShort() / 100; //船首,百分之一度[0-36000]	整数(uint16)	2		
            ship.course = ba.readUnsignedShort() / 100; //航向,百分之一度[0-36000]	整数(uint16)	2
            var speed = ba.readUnsignedShort();
            if (speed >= 52576) ship.speed = NaN;
            else ship.speed = speed / 514; //航速,毫米/秒[0,52576],整数(uint16)	2 //转成节
            ship.rot = ba.readShort() / 100; //旋转角速度,1/100度/秒，[-1200,1200]	整数(int16）	2	
            ship.lastTime = ba.readInt64(); //最后更新时间	整数(int64)	8
            return ship;
        },
        //解析批量船舶数据
        parseVectorShip: function (data) {
            var result = {}; //返回的数据
            if (encoding == 0) {//Base64
                data = base64.decode64(data);
                var ba = new ByteArray(data, ByteArray.Endian.LITTLE);
                //解析数据 
                try {
                    var dataLength = ba.readUnsignedInt();
                    var status = ba.readUnsignedShort();
                    result.status = status;
                    ba.readUnsignedInt(); //数据版本	Uint32	4
                    if (status == 0) {
                        var shipNum = ba.readUnsignedInt(); //船舶数量
                        var shipArray = []; //船舶的数据 
                        //解析船舶数据
                        while (shipNum--) {
                            shipArray.push(this.parseShip(ba)); //保存数据
                        }
                        result.data = shipArray;
                    }
                } catch (e) {
                    result.status = 2;
                }
            }
            return result;
        },
        //解析区域船舶数据
        parseRegionShip: function (data, regionData) {
            var result = {}; //返回的数据
            if (encoding == 0) {//Base64
                data = base64.decode64(data);
                var ba = new ByteArray(data, ByteArray.Endian.LITTLE);
                //解析数据 
                try {
                    var dataLength = ba.readUnsignedInt();
                    result.status = ba.readUnsignedShort();
                    if (result.status == 0) {
                        var serviceTime = ba.readInt64(); // //服务器当前时间	int64	8	serviceTime	
                        result.scode = ba.readUnsignedInt(); // 会话令牌	uint64	8	scode	服务端自动生成的会话令牌，客户端需要用此值更新保存的会话
                        var shipNum = ba.readUnsignedInt(); //船舶数量
                        var shipArray = []; //船舶的数据 
                        //解析船舶数据
                        while (shipNum--) {
                            var ship = this.parseShip(ba);
                            //是否在该区域内部
                            if (isLatLngInRegion({ lat: ship.lat, lng: ship.lng }, regionData)) {
                                shipArray.push(ship); //保存数据
                            }
                        }
                        result.data = shipArray;
                    }
                } catch (e) {
                    result.status = 2;
                }
            }
            return result;
        },
        //解析船队船舶数据
        parseFleetShip: function (source) {
            var result = {};
            if (encoding == 0) {//Base64
                source = base64.decode64(source);
                var ba = new ByteArray(source, ByteArray.Endian.LITTLE);
                try {
                    var len = ba.readUnsignedInt(); //数据包长度	整数(uint32)	4
                    result.status = ba.readUnsignedShort(); //数据包类型	整数(uint16)	2
                    if (result.status == 0) {
                        result.scode = ba.readUnsignedInt(); //数据版本号	uint32	4
                        result.version = ba.readUnsignedInt(); //船队版本号	uint32	4
                        var count = ba.readUnsignedInt(); //船舶数	整数(uint32)	4
                        var ships = [];
                        while (count--) {
                            ships.push(this.parseShip(ba));
                        }
                        result.data = ships;
                    }
                } catch (err) {
                    result.status = 2;
                }
            }
            return result;
        },
        //解析船队列表
        parseFleet: function (source) {
            var result = {};
            if (encoding == 0) {//Base64
                source = base64.decode64(source);
                var ba = new ByteArray(source, ByteArray.Endian.LITTLE);
                try {
                    ba.readUnsignedInt(); //数据包长度	整数(uint32)	4
                    result.status = ba.readUnsignedShort(); //数据包类型	整数(uint16)	2
                    if (result.status == 0) {
                        result.version = ba.readUnsignedInt(); //船队版本号	整数(uint32)	4
                        var count = ba.readUnsignedInt();; //数据个数	整数(uint32)	4
                        var groups = [], group;
                        while (count--) {
                            group = new shipxyAPI.Group();
                            group.name = base64.utf8to16(ba.readUTF()); //组名称	  string
                            var c = ba.readUnsignedInt().toString(16); //组颜色	uint32	4
                            c = c.substr(4, 2) + c.substr(2, 2) + c.substr(0, 2);
                            var w = 6 - c.length;
                            while (w--) { c += 0 };
                            group.color = '#' + c; //转成#000000格式
                            var shipCount = ba.readUnsignedInt(); //船舶个数	uint32	4
                            var ships = [], obj;
                            while (shipCount--) {
                                obj = {};
                                obj.shipId = '' + ba.readUnsignedInt64(); //船舶ID	uint64	8
                                obj.customName = base64.utf8to16(ba.readUTF()); //自定义船名	string
                                obj.remarks = base64.utf8to16(ba.readUTF()); //备注	string
                                ships.push(obj);
                            }
                            group.data = ships;
                            groups.push(group);
                        }
                        result.data = groups;
                    }
                } catch (err) {
                    result.status = 2;
                }
            }
            return result;
        },
        //解析查询船舶结果
        parseSearchShip: function (source, sOrd) {
            var result = {};
            if (encoding == 0) {//Base64
                source = base64.decode64(source);
                var ba = new ByteArray(source, ByteArray.Endian.LITTLE);
                try {
                    var len = ba.readUnsignedInt(); //数据包长度	整数(uint32)	4
                    result.status = ba.readUnsignedShort(); //数据包类型	整数(uint16)	2
                    if (result.status == 0) {
                        var count = ba.readUnsignedInt(); //数据个数	整数(uint32)	4
                        var ships = [], obj;
                        while (count--) {
                            obj = {};
                            var type = ba.readByte(); //匹配类型	byte	2   1mmsi，2船名，3imo，4呼号
                            if (sOrd == 0) {//简单信息
                                obj.shipId = '' + ba.readUnsignedInt64(); //船舶ID	uint64	8
                                var from = ba.readUnsignedInt(); //来源	uint32	4    0=AIS
                                obj.MMSI = '' + ba.readUnsignedInt(); //MMSI	uint32	4
                                obj.country = getShipCountry(obj.MMSI); //船籍
                                var shipType = ba.readUnsignedShort(); //船舶类型	uint16	2
                                obj.IMO = ba.readUnsignedInt(); //IMO	uint32	4
                                obj.name = ba.readUTF(); //船名	string
                                obj.callsign = ba.readUTF(); //呼号	string
                                var lastTime = ba.readInt64(); //更新时间	int64	8
                            } else if (sOrd == 1) {//详细信息
                            }
                            ships.push(obj);
                        }
                        result.data = ships;
                    }
                } catch (err) {
                    result.status = 2;
                }
            }
            return result;
        },
        //解析轨迹数据
        parseTrack: function (source) {
            var result = {};
            if (encoding == 0) {//Base64
                source = base64.decode64(source);
                var ba = new ByteArray(source, ByteArray.Endian.LITTLE);
                try {
                    var len = ba.readUnsignedInt(); //数据包长度	整数(uint32)	4
                    result.status = ba.readUnsignedShort(); //数据包类型	整数(uint16)	2
                    if (result.status == 0) {
                        var count = ba.readUnsignedInt(); //数据个数	整数(uint32)	4
                        var points = [], obj;
                        while (count--) {
                            obj = {};
                            obj.lastTime = ba.readInt64(); //航点时间	int64	8
                            obj.from = ba.readUnsignedShort(); //数据类型	uint16	2
                            obj.lng = ba.readInt() / 1000000; //经度	int32	4
                            obj.lat = ba.readInt() / 1000000; //纬度	int32	4
                            var speed = ba.readShort(); //对地速率	int16	2
                            if (speed >= 52576) obj.speed = NaN;
                            else obj.speed = speed / 514; //节
                            obj.course = ba.readShort() / 100; //对地航向	int16	2
                            points.push(obj);
                        }
                        result.data = points.sort(function (a, b) { return a.lastTime < b.lastTime ? -1 : 1 });
                        result['continue'] = ba.readUnsignedShort(); //是否还有数据	uint16	2
                    }
                } catch (err) {
                    result.status = 2;
                }
            }
            return result;
        },
        //解析状态码，成功还是失败，或者其他
        parseStatus: function (source) {
            var result = {};
            if (encoding == 0) {//Base64
                source = base64.decode64(source);
                var ba = new ByteArray(source, ByteArray.Endian.LITTLE);
                try {
                    var len = ba.readUnsignedInt(); //数据包长度	整数(uint32)	4
                    result.status = ba.readUnsignedShort(); //数据包类型	整数(uint16)	2
                } catch (err) {
                    result.status = 2;
                }
            }
            return result;
        }
    };
    //idtype:0或不填表示通过mmsi获取，否则通过imo获取
    var getShipsById = function (shipId, callback, idtype) {
        var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=2003&id=' + shipId + '&idtype=' + (idtype || 0);
        var that = this;
        var request = new XssHttpRequest(url, {
            callback: 'jsf',
            success: function (data) {
                var object = parse.parseVectorShip(data), status = object.status;
                if (status == 0) {
                    that.data = object.data;
                }
                callback.call(that, analyseStatus(status));
            },
            error: function () {
                callback.call(that, 100);
            }
        });
        request.send();
    };
    var getShipsByIds = function (shipIdArray, callback) {
        var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=2003&id=' + shipIdArray.toString();
        var that = this;
        var request = new XssHttpRequest(url, {
            callback: 'jsf',
            success: function (data) {
                var object = parse.parseVectorShip(data), status = object.status;
                if (status == 0) {
                    that.data = object.data;
                }
                callback.call(that, analyseStatus(status));
            },
            error: function () {
                callback.call(that, 100);
            }
        });
        request.send();
    };
    var getShipsByRegion = function (region, callback) {
        var points = region.data;
        if (!points && points.length < 3) throw new Error(isen ? 'range must be a polygon and at least three point' : '区域必须是有效的多边形，不能少于三个点');
        var xy = '', i = 0, len = points.length, pos;
        for (; i < len; i++) {
            pos = points[i];
            if (i > 0) xy += '-';
            xy += pos.lng * 1000000 + ',' + pos.lat * 1000000;
        }
        var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=2004&mode=0&scode=' + this.scode + '&xy=' + xy;
        var that = this;
        var request = new XssHttpRequest(url, {
            callback: 'jsf',
            success: function (data) {
                var object = parse.parseRegionShip(data, points), status = object.status;
                if (status == 0) {
                    that.data = object.data;
                    that.scode = object.scode;
                }
                callback.call(that, analyseStatus(status));
            },
            error: function () {
                callback.call(that, 100);
            }
        });
        request.send();
    };
    var getShipsByRegions = function (regionArray, callback) {
        //暂不实现
    };
    var getShipsByFleet = function (fleet, callback) {
        var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=2006&dv=' + this.scode + '&fv=' + fleet.version;
        var that = this;
        var request = new XssHttpRequest(url, {
            callback: 'jsf',
            success: function (data) {
                var result = parse.parseFleetShip(data), status = result.status;
                if (status == 0) {
                    that.data = result.data;
                    that.scode = result.scode;
                    fleet.version = result.version;
                }
                callback.call(that, analyseStatus(status));
            }, error: function () {
                callback.call(that, 100);
            }
        });
        request.send();
    };
    //初始化获取船队列表
    var getFleet = function (callback) {
        var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=1000';
        var that = this;
        var request = new XssHttpRequest(url, {
            callback: 'jsf',
            success: function (data) {
                var result = parse.parseFleet(data), status = result.status;
                if (status == 0) {
                    that.version = result.version;
                    that.data = result.data;
                }
                callback.call(that, analyseStatus(status));
            },
            error: function () {
                callback.call(that, 100);
            }
        });
        request.send();
    };
    //船舶数据查询类的方法
    shipxyAPI.Ships.prototype = {
        //请求或更新最新船舶数据
        getShips: function (callback, idtype) {
            switch (this.type) {
                case shipxyAPI.Ships.INIT_SHIPID:
                    if (typeof this.condition == 'string') {
                        getShipsById.call(this, this.condition, callback, idtype);
                    } else if (this.condition instanceof Array) {
                        getShipsByIds.call(this, this.condition, callback);
                    }
                    break;
                case shipxyAPI.Ships.INIT_REGION:
                    if (this.condition instanceof shipxyAPI.Region) {
                        getShipsByRegion.call(this, this.condition, callback);
                    } else if (this.condition instanceof Array) {
                        getShipsByRegions.call(this, this.condition, callback);
                    }
                    break;
                case shipxyAPI.Ships.INIT_FLEET:
                    getShipsByFleet.call(this, this.condition, callback);
                    break;
            }
        }
    };
    //继承父类Ships的方法
    inheritPrototype(shipxyAPI.AutoShips, shipxyAPI.Ships, {
        //设置更新的时间，默认30秒
        setAutoUpdateInterval: function (interval) {
            if (typeof interval == 'number' && !isNaN(interval)) {
//                if (interval < 30)
//                    interval = 30; //小于30秒  变成30秒
                this.interval = interval;
            }
        },
        //开启更新
        startAutoUpdate: function (callback) {
            var that = this;
            this.timer = setInterval(function () {
                that.getShips.call(that, callback)
            }, this.interval * 1000);
        },
        //停止更新
        stopAutoUpdate: function () {
            clearInterval(this.timer);
            this.timer = 0;
        }
    });
    //查询类的方法
    shipxyAPI.Search.prototype = {
        //根据条件筛选查询船舶，条件可以自由组合
        searchShip: function (option, callback) {
            var url = APIConfig.shipserver.replace('/index', '/queryship') + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&kw=' + option.keyword + '&max=' + (option.max || 20);
            var that = this;
            var request = new XssHttpRequest(url, {
                callback: 'jsf',
                success: function (data) {
                    var result = parse.parseSearchShip(data, option.type || 0), status = result.status;
                    if (status == 0) {
                        that.data = result.data;
                    } else {
                        that.data = null;
                    }
                    callback.call(that, analyseStatus(status));
                },
                error: function () {
                    that.data = null;
                    callback.call(that, 100);
                }
            });
            request.send();
        }
    };
    //历史轨迹查询类的方法
    shipxyAPI.Tracks.prototype = {
        //获取历史轨迹数据
        getTrack: function (shipId, startTime, endTime, callback) {
            var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=2005&cut=1&id=' + shipId + '&btm=' + startTime + '&etm=' + endTime;
            var that = this;
            this.request = new XssHttpRequest(url, {
                callback: 'jsf',
                timeout: 30000, //查轨迹，30秒超时
                success: function (data) {
                    delete that.request;
                    var result = parse.parseTrack(data), status = result.status;
                    if (status == 0) {
                        var c, a = result.data || [];
                        for (var i = a.length - 1; i >= 0; i--) {
                            c = a[i];
                            if (c.lastTime < startTime || c.lastTime > endTime) a.splice(i, 1);
                        }
                        if (!that.data) {
                            that.data = new shipxyAPI.Track(shipId, startTime, endTime);
                            that.data.data = result.data;
                        } else {
                            that.data.data = that.data.data.concat(result.data);
                        }
                        if (result['continue'] == 1) {//有分割数据，继续请求[以最后一个轨迹点的lastTime为起始时间]
                            that.getTrack(shipId, result.data[result.data.length - 1].lastTime, endTime, callback);
                            return;
                        }
                    } else {
                        that.data = null;
                    }
                    callback.call(that, analyseStatus(status));
                },
                error: function () {
                    delete that.request;
                    that.data = null;
                    callback.call(that, 100);
                }
            });
            this.request.send();
        },
        //销毁本次轨迹查询，只有在当本次查询尚未返回结果之前调用本方法，才会有实际意义
        abort: function () {
            if (this.request) {
                this.request.abort();
                this.data = null;
                delete this.request;
            }
        }
    };
    //船队类的原型方法
    shipxyAPI.Fleet.prototype = {
        //根据组名获取分组
        getGroup: function (name) {
            var group, len = this.data.length;
            while (len--) {
                group = this.data[len];
                if (group.name == name) return group;
            }
            return null;
        },
        //根据船舶Id获取该船所在分组集合，因为一条船可能存在多个组中
        getGroupsByShipId: function (shipId) {
            var group, ids, rets = [];
            for (var i = 0, len1 = this.data.length; i < len1; i++) {
                group = this.data[i];
                ids = group.getShipIds();
                for (var j = 0, len2 = ids.length; j < len2; j++) {
                    if (ids[j] == shipId) {
                        rets.push(group);
                        break;
                    }
                }
            }
            return rets;
        },
        //添加一个新组
        addGroup: function (group, callback) {
            if (!(group instanceof shipxyAPI.Group)) throw new Error(isen ? 'param must be a instanceof shipxyAPI.Group' : 'addGroup方法的第一个参数必须是shipxyAPI.Group实例');
            var gc = group.color;
            gc = parseInt('0x' + gc.substr(1, 2)) + ',' + parseInt('0x' + gc.substr(3, 2)) + ',' + parseInt('0x' + gc.substr(5, 2));
            var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=1001&gn=' + group.name + '&gc=' + gc + '&wk=' + shipxyAPI.password;
            var that = this;
            var request = new XssHttpRequest(url, {
                callback: 'jsf',
                success: function (data) {
                    var result = parse.parseStatus(data), status = result.status;
                    if (status == 0) {
                        that.data.push(group);
                    }
                    callback.call(that, analyseStatus(status));
                }, error: function () {
                    callback.call(that, 100);
                }
            });
            request.send();
        },
        //修改一个组的内容，修改内容可以是组名，也可以是组颜色，当然也可以是全部
        modifyGroup: function (group, groupObj, callback) {
            if (typeof group == 'string') group = this.getGroup(group);
            if (!group) throw new Error(isen ? 'param error' : 'modifyGroup方法的第一个参数错误，没有找到该组');
            if (!groupObj) throw new Error(isen ? 'second param error' : 'modifyGroup方法的第二个参数必须是不能为空，且应该指定组名和/或组颜色属性');
            var gc = groupObj.color || group.color, gcs, name = groupObj.name || group.name;
            if (gc) gcs = parseInt('0x' + gc.substr(1, 2)) + ',' + parseInt('0x' + gc.substr(3, 2)) + ',' + parseInt('0x' + gc.substr(5, 2));
            var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=1002&gn=' + group.name + '&gc=' + gcs + '&ngn=' + name + '&wk=' + shipxyAPI.password;
            var that = this;
            var request = new XssHttpRequest(url, {
                callback: 'jsf',
                success: function (data) {
                    var result = parse.parseStatus(data), status = result.status;
                    if (status == 0) {
                        if (name) group.name = name;
                        if (gc) group.color = gc;
                    }
                    callback.call(that, analyseStatus(status));
                }, error: function () {
                    callback.call(that, 100);
                }
            });
            request.send();
        },
        //删除一个组，将会删除该组下的全部船舶
        delGroup: function (group, callback) {
            if (typeof group == 'string') group = this.getGroup(group);
            if (!group) throw new Error(isen ? 'param error' : 'delGroup方法的第一个参数错误，没有找到该组');
            var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=1003&gn=' + group.name + '&wk=' + shipxyAPI.password;
            var that = this;
            var request = new XssHttpRequest(url, {
                callback: 'jsf',
                success: function (data) {
                    var result = parse.parseStatus(data), status = result.status;
                    if (status == 0) {
                        var len = that.data.length;
                        while (len--) {
                            if (that.data[len] == group) {
                                that.data.splice(len, 1);
                                break;
                            }
                        }
                    }
                    callback.call(that, analyseStatus(status));
                }, error: function () {
                    callback.call(that, 100);
                }
            });
            request.send();
        },
        //向指定的组内添加一条新船舶
        addShip: function (shipObj, group, callback) {
            if (!shipObj) throw new Error(isen ? 'param error' : 'addShip方法的第一个参数必须是不能为空，且应该指定船舶Id和/或自定义船名、备注属性');
            var shipId = shipObj.shipId;
            if (!shipId) throw new Error(isen ? 'param error' : 'addShip方法的第一个参数必须包含船舶Id属性');
            if (typeof group == 'string') group = this.getGroup(group);
            if (!group) throw new Error(isen ? 'second param error' : 'addShip方法的第二个参数错误，没有找到该组');
            var cn = shipObj.customName || '', rmk = shipObj.remarks || '';
            var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=1004&gn=' + group.name + '&id=' + shipId + '&cn=' + cn + '&rmk=' + rmk + '&wk=' + shipxyAPI.password;
            var that = this;
            var request = new XssHttpRequest(url, {
                callback: 'jsf',
                success: function (data) {
                    var result = parse.parseStatus(data), status = result.status;
                    if (status == 0) {
                        group.data.push({ shipId: shipId, customName: cn, remarks: rmk });
                    }
                    callback.call(that, analyseStatus(status));
                }, error: function () {
                    callback.call(that, 100);
                }
            });
            request.send();
        },
        //修改指定的船舶
        modifyShip: function (shipObj, group, callback) {
            if (!shipObj) throw new Error(isen ? 'param error' : 'modifyShip方法的第一个参数必须是不能为空，且应该指定船舶Id和/或自定义船名、备注属性');
            var shipId = shipObj.shipId;
            if (!shipObj.shipId) throw new Error(isen ? 'param error' : 'modifyShip方法的第一个参数必须包含船舶Id属性');
            if (typeof group == 'string') group = this.getGroup(group);
            if (!group) throw new Error(isen ? 'second param error' : 'modifyShip方法的第二个参数错误，没有找到该组');
            var cn = shipObj.customName || '', rmk = shipObj.remarks || '';
            var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=1004&gn=' + group.name + '&id=' + shipId + '&cn=' + cn + '&rmk=' + rmk + '&wk=' + shipxyAPI.password;
            var that = this;
            var request = new XssHttpRequest(url, {
                callback: 'jsf',
                success: function (data) {
                    var result = parse.parseStatus(data), status = result.status;
                    if (status == 0) {
                        var ship = group.getShip(shipId);
                        if (!ship) group.data.push({ shipId: shipId, customName: cn, remarks: rmk }); //不存在，则加入
                        else {
                            //修改船舶数据内容
                            ship.customName = cn;
                            ship.remarks = rmk;
                        }
                    }
                    callback.call(that, analyseStatus(status));
                }, error: function () {
                    callback.call(that, 100);
                }
            });
            request.send();
        },
        //从组内删除指定的船舶
        delShip: function (shipId, group, callback) {
            if (!shipId) throw new Error(isen ? 'param error' : 'delShip方法的第一个参数不能为空，必须指定为船舶Id');
            if (typeof group == 'string') group = this.getGroup(group);
            if (!group) throw new Error(isen ? 'second param error' : 'modifyShip方法的第二个参数错误，没有找到该组');
            var url = APIConfig.shipserver + '?v=' + version + '&k=' + shipxyAPI.key + '&enc=' + encoding + '&cmd=1005&gn=' + group.name + '&id=' + shipId + '&wk=' + shipxyAPI.password;
            var that = this;
            var request = new XssHttpRequest(url, {
                callback: 'jsf',
                success: function (data) {
                    var result = parse.parseStatus(data), status = result.status;
                    if (status == 0) {
                        var d = group.data, le = d.length;
                        while (le--) {
                            if (d[le].shipId == shipId) {
                                d.splice(le, 1);
                                break;
                            }
                        }
                    }
                    callback.call(that, analyseStatus(status));
                }, error: function () {
                    callback.call(that, 100);
                }
            });
            request.send();
        }
    };
    //历史挂靠查询类的方法
    //船舶挂靠港历史
    shipxyAPI.PortOfCallByShip.prototype = {
        //获取历史挂靠数据
        getCalls: function (callObj, callback) {
            if (!callObj) throw new Error(isen ? 'param error' : 'PortOfCallByShip方法的第一个参数必须是不能为空，且应该指定船舶信息及查询时间段');
            if (!callObj.shipId && !callObj.imo && !callObj.shipname && !callObj.callsign) throw new Error(isen ? 'param error' : 'PortOfCallByShip方法的第一个参数应该指定 shipId、imo、shipname、callsign 其中至少一种船舶属性信息');
            if (!callObj.startTime || !callObj.endTime) throw new Error(isen ? 'param error' : 'PortOfCallByShip方法的第一个参数应该指定开始时间和结束时间');
            var url = APIConfig.root + '/apicall/GetPortOfCallByShip?v=' + version + '&k=' + shipxyAPI.key + '&mmsi=' + (callObj.shipId ? callObj.shipId : "") + '&imo=' + (callObj.imo ? callObj.imo : "") + '&shipname=' + (callObj.shipname ? callObj.shipname : "") + '&callsign=' + (callObj.callsign ? callObj.callsign : "") + '&begin=' + callObj.startTime + '&end=' + callObj.endTime;
            var that = this;
            this.request = new XssHttpRequest(url, {
                callback: 'jsf',
                timeout: 30000, //查挂靠，30秒超时
                success: function (data) {
                    var result = data, status = data.status;
                    if (status == 0) {
                        that.data = result;
                    } else {
                        that.data = null;
                    }
                    callback.call(that, analyseStatus(status));
                },
                error: function () {
                    delete that.request;
                    that.data = null;
                    callback.call(that, 100);
                }
            });
            this.request.send();
        },
        //销毁本次历史挂靠查询，只有在当本次查询尚未返回结果之前调用本方法，才会有实际意义
        abort: function () {
            if (this.request) {
                this.request.abort();
                this.data = null;
                delete this.request;
            }
        }
    };
    //指定港口挂靠港历史
    shipxyAPI.PortOfCallByPort.prototype = {
        //portId, portCode, startTime, endTime
        //获取历史挂靠数据
        getCalls: function (callObj, callback) {
            if (!callObj) throw new Error(isen ? 'param error' : 'PortOfCallByPort方法的第一个参数必须是不能为空，且应该指定船舶信息及查询时间段');
            if (!callObj.portId && !callObj.portCode) throw new Error(isen ? 'param error' : 'PortOfCallByPort方法的第一个参数应该指定 港口id、港口code 其中至少一种港口属性信息');
            if (!callObj.startTime || !callObj.endTime) throw new Error(isen ? 'param error' : 'PortOfCallByPort方法的第一个参数应该指定开始时间和结束时间');
            var url = APIConfig.root + '/apicall/GetPortOfCallByPort?v=' + version + '&k=' + shipxyAPI.key + '&portid=' + (callObj.portId ? callObj.portId : "") + '&portcode=' + (callObj.portCode ? callObj.portCode : "") + '&begin=' + callObj.startTime + '&end=' + callObj.endTime;
            var that = this;
            this.request = new XssHttpRequest(url, {
                callback: 'jsf',
                timeout: 30000, //查挂靠，30秒超时
                success: function (data) {
                    var result = data, status = data.status;
                    if (status == 0) {
                        that.data = result;
                    } else {
                        that.data = null;
                    }
                    callback.call(that, analyseStatus(status));
                },
                error: function () {
                    delete that.request;
                    that.data = null;
                    callback.call(that, 100);
                }
            });
            this.request.send();
        },
        //销毁本次历史挂靠查询，只有在当本次查询尚未返回结果之前调用本方法，才会有实际意义
        abort: function () {
            if (this.request) {
                this.request.abort();
                this.data = null;
                delete this.request;
            }
        }
    };
    //船舶挂靠指定港口历史
    shipxyAPI.PortOfCallByShipPort.prototype = {
        //shipId, imo, shipname, callsign, portid ,startTime, endTime, timetype
        //获取历史挂靠数据
        getCalls: function (callObj, callback) {
            if (!callObj) throw new Error(isen ? 'param error' : 'PortOfCallByShipPort方法的第一个参数必须是不能为空，且应该指定船舶信息、港口信息及查询时间段');
            if (!callObj.shipId && !callObj.imo && !callObj.shipname && !callObj.callsign) throw new Error(isen ? 'param error' : 'PortOfCallByShipPort方法的第一个参数应该指定 shipId、imo、shipname、callsign 其中至少一种船舶属性信息');
            if (!callObj.portid) throw new Error(isen ? 'param error' : 'PortOfCallByShipPort方法的第一个参数应该指定 港口信息');
            if (!callObj.startTime || !callObj.endTime) throw new Error(isen ? 'param error' : 'PortOfCallByShipPort方法的第一个参数应该指定开始时间和结束时间');
            var url = APIConfig.root + '/apicall/GetPortOfCallByShipPort?v=' + version + '&k=' + shipxyAPI.key + '&mmsi=' + (callObj.shipId ? callObj.shipId : "") + '&imo=' + (callObj.imo ? callObj.imo : "") + '&shipname=' + (callObj.shipname ? callObj.shipname : "") + '&callsign=' + (callObj.callsign ? callObj.callsign : "") + '&portid=' + (callObj.portid ? callObj.portid : "") + '&begin=' + callObj.startTime + '&end=' + callObj.endTime + '&timetype=' + (callObj.timetype ? callObj.timetype : "");
            var that = this;
            this.request = new XssHttpRequest(url, {
                callback: 'jsf',
                timeout: 30000, //查挂靠，30秒超时
                success: function (data) {
                    var result = data, status = data.status;
                    if (status == 0) {
                        that.data = result;
                    } else {
                        that.data = null;
                    }
                    callback.call(that, analyseStatus(status));
                },
                error: function () {
                    delete that.request;
                    that.data = null;
                    callback.call(that, 100);
                }
            });
            this.request.send();
        },
        //销毁本次历史挂靠查询，只有在当本次查询尚未返回结果之前调用本方法，才会有实际意义
        abort: function () {
            if (this.request) {
                this.request.abort();
                this.data = null;
                delete this.request;
            }
        }
    };
    //船舶挂靠当前状态
    shipxyAPI.ShipStatus.prototype = {
        //获取船舶数据
        getCalls: function (callObj, callback) {
            if (!callObj) throw new Error(isen ? 'param error' : 'ShipStatus方法的第一个参数必须是不能为空，且应该指定船舶信息');
            if (!callObj.shipId && !callObj.imo && !callObj.shipname && !callObj.callsign) throw new Error(isen ? 'param error' : 'ShipStatus方法的第一个参数应该指定 shipId、imo、shipname、callsign 其中至少一种船舶属性信息');
            var url = APIConfig.root + '/apicall/GetShipStatus?v=' + version + '&k=' + shipxyAPI.key + '&mmsi=' + (callObj.shipId ? callObj.shipId : "") + '&imo=' + (callObj.imo ? callObj.imo : "") + '&shipname=' + (callObj.shipname ? callObj.shipname : "") + '&callsign=' + (callObj.callsign ? callObj.callsign : "");
            var that = this;
            this.request = new XssHttpRequest(url, {
                callback: 'jsf',
                timeout: 30000, //查挂靠，30秒超时
                success: function (data) {
                    var result = data, status = data.status;
                    if (status == 0) {
                        that.data = result;
                    } else {
                        that.data = null;
                    }
                    callback.call(that, analyseStatus(status));
                },
                error: function () {
                    delete that.request;
                    that.data = null;
                    callback.call(that, 100);
                }
            });
            this.request.send();
        },
        //销毁本次历史挂靠查询，只有在当本次查询尚未返回结果之前调用本方法，才会有实际意义
        abort: function () {
            if (this.request) {
                this.request.abort();
                this.data = null;
                delete this.request;
            }
        }
    };
    //获取船舶档案
    shipxyAPI.ShipParticular.prototype = {
        //获取船舶数据 shipId, imo, shipname, callsign
        getShipParticular: function (callObj, callback) {
            if (!callObj) throw new Error(isen ? 'param error' : 'ShipParticular方法的第一个参数必须是不能为空，且应该指定船舶信息');
            if (!callObj.shipId && !callObj.imo && !callObj.shipname && !callObj.callsign) throw new Error(isen ? 'param error' : 'ShipParticular方法的第一个参数应该指定 shipId、imo、shipname、callsign 其中至少一种船舶属性信息');
            var url = APIConfig.root + '/apicall/SearchShipParticular?v=' + version + '&k=' + shipxyAPI.key + '&mmsi=' + (callObj.shipId ? callObj.shipId : "") + '&imo=' + (callObj.imo ? callObj.imo : "") + '&shipname=' + (callObj.shipname ? callObj.shipname : "") + '&callsign=' + (callObj.callsign ? callObj.callsign : "");
            var that = this;
            this.request = new XssHttpRequest(url, {
                callback: 'jsf',
                timeout: 30000, //查挂靠，30秒超时
                success: function (data) {
                    var result = data, status = data.status;
                    if (status == 0) {
                        that.data = result;
                    } else {
                        that.data = null;
                    }
                    callback.call(that, analyseStatus(status));
                },
                error: function () {
                    delete that.request;
                    that.data = null;
                    callback.call(that, 100);
                }
            });
            this.request.send();
        },
        //销毁本次历史挂靠查询，只有在当本次查询尚未返回结果之前调用本方法，才会有实际意义
        abort: function () {
            if (this.request) {
                this.request.abort();
                this.data = null;
                delete this.request;
            }
        }
    };
    //判断某经纬度点是否在闭合多边形内部
    var isLatLngInRegion = function (latLng, latLngs) {
        var i, latLng1, latLng2, minLng, maxLng, xInt, crossings = 0, lng1, lat1, lng2, lat2, n = latLngs.length;
        for (i = 1; i <= n; i++) {
            if (i == n) {
                latLng1 = latLngs[0];
                latLng2 = latLngs[n - 1];
                if ((latLng1.lat == latLng2.lat) && (latLng1.lng == latLng2.lng)) continue;
            } else {
                latLng1 = latLngs[i];
                latLng2 = latLngs[i - 1];
            }
            if (latLng1.lng < latLng.lng && latLng2.lng < latLng.lng) continue;
            if ((latLng.lat == latLng2.lat) && (latLng.lng == latLng2.lng)) return false;
            if (latLng1.lat == latLng.lat && latLng2.lat == latLng.lat) {
                minLng = latLng1.lng;
                maxLng = latLng2.lng;
                if (minLng > maxLng) {
                    minLng = latLng2.lng;
                    maxLng = latLng1.lng;
                }
                if (latLng.lng >= minLng && latLng.lng <= maxLng) return false;
                continue;
            }
            if ((latLng1.lat > latLng.lat && latLng2.lat <= latLng.lat) || (latLng2.lat > latLng.lat && latLng1.lat <= latLng.lat)) {
                lng1 = latLng1.lng - latLng.lng;
                lat1 = latLng1.lat - latLng.lat;
                lng2 = latLng2.lng - latLng.lng;
                lat2 = latLng2.lat - latLng.lat;
                xInt = signOfDet2x2(lng1, lat1, lng2, lat2);
                if (xInt == 0.0) return false;
                if (lat2 < lat1) xInt = -xInt;
                if (xInt > 0.0) crossings++;
            }
        }
        return (crossings % 2) == 1;
    };
    var signOfDet2x2 = function (x1, y1, x2, y2) {
        var sign = 1, swap, k;
        if ((x1 == 0.0) || (y2 == 0.0)) {
            if ((y1 == 0.0) || (x2 == 0.0)) {
                return 0;
            } else if (y1 > 0) {
                if (x2 > 0) {
                    return -sign;
                } else {
                    return sign;
                }
            } else {
                if (x2 > 0) {
                    return sign;
                } else {
                    return -sign;
                }
            }
        }
        if ((y1 == 0.0) || (x2 == 0.0)) {
            if (y2 > 0) {
                if (x1 > 0) {
                    return sign;
                } else {
                    return -sign;
                }
            } else {
                if (x1 > 0) {
                    return -sign;
                } else {
                    return sign;
                }
            }
        }
        if (0.0 < y1) {
            if (0.0 < y2) {
                if (y1 <= y2) {
                    ;
                } else {
                    sign = -sign;
                    swap = x1;
                    x1 = x2;
                    x2 = swap;
                    swap = y1;
                    y1 = y2;
                    y2 = swap;
                }
            } else {
                if (y1 <= -y2) {
                    sign = -sign;
                    x2 = -x2;
                    y2 = -y2;
                } else {
                    swap = x1;
                    x1 = -x2;
                    x2 = swap;
                    swap = y1;
                    y1 = -y2;
                    y2 = swap;
                }
            }
        } else {
            if (0.0 < y2) {
                if (-y1 <= y2) {
                    sign = -sign;
                    x1 = -x1;
                    y1 = -y1;
                } else {
                    swap = -x1;
                    x1 = x2;
                    x2 = swap;
                    swap = -y1;
                    y1 = y2;
                    y2 = swap;
                }
            } else {
                if (y1 >= y2) {
                    x1 = -x1;
                    y1 = -y1;
                    x2 = -x2;
                    y2 = -y2;
                } else {
                    sign = -sign;
                    swap = -x1;
                    x1 = -x2;
                    x2 = swap;
                    swap = -y1;
                    y1 = -y2;
                    y2 = swap;
                }
            }
        }
        if (0.0 < x1) {
            if (0.0 < x2) {
                if (x1 <= x2) {
                    ;
                } else {
                    return sign;
                }
            } else {
                return sign;
            }
        } else {
            if (0.0 < x2) {
                return -sign;
            } else {
                if (x1 >= x2) {
                    sign = -sign;
                    x1 = -x1;
                    x2 = -x2;
                } else {
                    return -sign;
                }
            }
        }
        while (true) {
            k = Math.floor(x2 / x1);
            x2 = x2 - k * x1;
            y2 = y2 - k * y1;
            if (y2 < 0.0) {
                return -sign;
            }
            if (y2 > y1) {
                return sign;
            }
            if (x1 > x2 + x2) {
                if (y1 < y2 + y2) {
                    return sign;
                }
            } else {
                if (y1 > y2 + y2) {
                    return -sign;
                } else {
                    x2 = x1 - x2;
                    y2 = y1 - y2;
                    sign = -sign;
                }
            }
            if (y2 == 0.0) {
                if (x2 == 0.0) {
                    return 0;
                } else {
                    return -sign;
                }
            }
            if (x2 == 0.0) {
                return sign;
            }
            k = Math.floor(x1 / x2);
            x1 = x1 - k * x2;
            y1 = y1 - k * y2;
            if (y1 < 0.0) {
                return sign;
            }
            if (y1 > y2) {
                return -sign;
            }
            if (x2 > x1 + x1) {
                if (y2 < y1 + y1) {
                    return -sign;
                }
            } else {
                if (y2 > y1 + y1) {
                    return sign;
                } else {
                    x1 = x2 - x1;
                    y1 = y2 - y1;
                    sign = -sign;
                }
            }
            if (y1 == 0.0) {
                if (x1 == 0.0) {
                    return 0;
                } else {
                    return sign;
                }
            }
            if (x1 == 0.0) {
                return -sign;
            }
        }
        return 0;
    };
})();

(function () {
    RootPath = APIConfig.root;
    MapKey = APIConfig.key; //shipxyMap的key，用于验证Flash地图是否可以正常使用
    TideServer = APIConfig.tide; //潮汐服务地址
    flashPath = APIConfig.root + 'apiresource/1.3/shipxyAPI.swf?v=' + APIConfig.flashver;
    APIConfig.shipserver = APIConfig.shipserver; //船讯网数据服务路径

    var isen = (navigator.userLanguage || navigator.language).toLowerCase().indexOf('cn') == -1; //检测语言版本
    var flash = null; //flash 组件   
    var jsCallbackHook = {}; //js/as通信的回调函数钩子集合
    var jsEventHook = {}; //js/as注册的事件处理函数钩子集合
    var overlayList = {}; //所有添加到地图上的overlay缓存

    G = function (s) { return document.getElementById(s) }
    json = function (s) { try { return window.JSON ? JSON.parse(s) : eval('(' + s + ')') } catch (e) { } }
    E = function (o, e, f) { if (!e) { e = 'load'; f = o; o = window } if (window.attachEvent) { o.attachEvent('on' + e, f) } else { o.addEventListener(e, f, false) } }

    loadScript = function (url, callback) {
        var c = document.createElement('script');
        c.src = url;
        if (callback) {
            if (/IE (6|7|8)/.test(navigator.userAgent)) {
                c.onreadystatechange = function () { if (/loaded|complete/.test(c.readyState)) callback(1) }
            } else {
                c.onload = function () { callback(1) }
            }
            c.onerror = function () { callback() }
        }
        document.body.appendChild(c);
    }

    loadStyle = function (url) {
        var c = document.createElement('link');
        c.setAttribute('rel', 'stylesheet');
        c.setAttribute('type', 'text/css');
        c.href = url;
        document.body.appendChild(c);
    }

    formatTime = function (time, len) {
        if (!time) time = new Date().getTime() / 1000;
        var t = new Date(parseFloat(time) * 1000);
        var m = t.getMonth() + 1, d = t.getDate(), H = t.getHours(), M = t.getMinutes(), S = t.getSeconds();
        if (m < 10) m = '0' + m;
        if (d < 10) d = '0' + d;
        if (H < 10) H = '0' + H;
        if (M < 10) M = '0' + M;
        if (S < 10) S = '0' + S;
        t = [t.getFullYear(), '-', m, '-', d, ' ', H, ':', M, ':', S].join('');
        if (len) t = t.substr(0, len);
        return t;
    }

    shipxyMap = {
        name: 'shipxyMap',
        key: MapKey,

        //初始化
        init: function () {
            this.getUserPower(function () {
                if (UserPower.tide) { //加载潮汐
                    loadScript(RootPath + 'api/res/shipxyTide.js?v=6', function () {
                        if ((window.map || window.myApp) && window.Tide) Tide.init();
                    });
                }
                if (UserPower.typhoon) { //加载台风
                    loadScript(RootPath + 'api/res/Typhoon.js?v=6', function () {
                        if ((window.map || window.myApp) && window.Typhoon) Typhoon.init();
                    });
                }
            })
        },

        //获取用户权限
        getUserPower: function (callback) {
            loadScript(APIConfig.shipserver + '?v=1&k=' + MapKey + '&enc=1&cmd=2007&jsf=onLoadUserPower');
            onLoadUserPower = function (s) {
                UserPower = json(s) || {};
                if (callback) callback();
            }
        },

        //地图类
        Map: function (container, mapOptions) {
            if (this instanceof shipxyMap.Map) {
                var con = null;
                if (typeof container === "object") {
                    con = container;
                } else if (typeof container === 'string') {
                    con = document.getElementById(container);
                } else {
                    throw new Error(isen ? 'param undefined' : '请为shipxyMap.Map构造函数指定第一个参数，该参数是装载地图的HTML容器，可以是容器本身，也可以是其id属性');
                }
                if (!con) {
                    con.innerHTML = isen ? 'flash container undefined' : "未能找到flash容器";
                    return;
                }
                mapOptions = mapOptions || new shipxyMap.MapOptions();
                if (!(mapOptions instanceof shipxyMap.MapOptions)) {
                    throw new Error(isen ? 'second param need an instance of shipxyMap.MapOptions' : '请为shipxyMap.Map构造函数第二个参数指定为shipxyMap.MapOptions的一个实例，或者为空值采用默认内容');
                }
                this.center = mapOptions.center; //当前中心点
                this.zoom = mapOptions.zoom; //当前缩放级别
                this.lang = mapOptions.lang; //新增地图参数
                this.language = mapOptions.language; //新增API语言版本
                this.hideBar = mapOptions.hideBar; //新增海洋气象隐藏参数
                this.mapTypeBar = mapOptions.mapTypeBar; ////新增地图bar参数
                this.mapType = mapOptions.mapType; //当前地图类型
                this.openStreetMap = (mapOptions.openStreetMap || 0); //地图强制使用openStreetMap
                this.hidePort = mapOptions.hidePort; //新增港口隐藏参数
                this.id = 'map' + new Date().getTime() + Math.random(); //生成唯一的Map id

                flash = getFlashObject(this.id, con, mapOptions); //获取Flash对象
                if (!flash) {
                    this.initialized = false;
                    con.innerHTML = isen ? 'flash init failed' : "flash加载失败";
                } else {
                    window.flash = flash;
                    var m = this;
                    //flash初始化完毕
                    shipxyMap.flashInitialized = function (value) {
                        if (value == 1) {
                            m.initialized = true;
                        } else {
                            m.initialized = false;
                        }
                        m.initialized = true;
                        delete shipxyMap.flashInitialized;
                        setTimeout(function () { shipxyMap.init(); })
                    }
                }
            } else {
                return new shipxyMap.Map(container, mapOptions);
            }
        },

        //Map构造函数的可选参数，用来设置地图初始化时的一些参数
        MapOptions: function () {
            if (this instanceof shipxyMap.MapOptions) {
                this.center = new shipxyMap.LatLng(30, 122); //初始化定位的中心点地理位置，默认为(30,122)
                this.zoom = 5; //初始化定位地图级别，默认为5级
                this.mapType = shipxyMap.MapType.GOOGLEMAP; //初始化地图类型，默认为Google地图
                this.mapTypes = [shipxyMap.MapType.CMAP, shipxyMap.MapType.GOOGLEMAP, shipxyMap.MapType.GOOGLESATELLITE]; //初始化地图类型集合，默认三种
                this.cmapType = shipxyMap.CMapType.DEFAULT; //初始化海图类型，为默认的中国海图 
                this.lang = ""; //新增地图参数
                if (isen) {//检测语言版本
                    this.language = "en"; //新增api语言版本
                } else {
                    this.language = "cn";
                }
                this.hideBar = ""; //新增海洋气象隐藏参数              
                this.mapTypeBar = ""; //新增地图bar参数
                this.hidePort = ""; //新增港口隐藏参数               

            } else {
                return new shipxyMap.MapOptions();
            }
        },

        //地图类型
        MapType: {
            //海图
            CMAP: 'cmap',
            //Google地图
            GOOGLEMAP: 'googlemap',
            //Google卫星图
            GOOGLESATELLITE: 'googlesatellite',
            //取得地图类型中文名称
            getName: function (mapType) {
                switch (mapType) {
                    case this.CMAP: return isen ? 'CMap' : '海图';
                    case this.GOOGLEMAP: return isen ? 'GoogleMap' : '地图';
                    case this.GOOGLESATELLITE: return isen ? 'Satellite' : '卫星图';
                }
            }
        },

        //海图类型
        CMapType: {
            //默认，船讯网海图
            DEFAULT: 0,
            //高级，中国海图
            ADVANCED: 1
        },

        //经纬度坐标点，用于标注地图上的一个地理经纬度点
        LatLng: function (lat, lng) {
            if (this instanceof shipxyMap.LatLng) {
                if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
                    throw new Error(isen ? 'error param shipxyMap.LatLng' : 'shipxyMap.LatLng构造函数参数必须是有效数值');
                }
                this.lat = lat; //地理纬度
                this.lng = lng; //地理经度
            } else {
                return new shipxyMap.LatLng(lat, lng);
            }
        },

        //经纬度矩形区域，通过西南角、东北角经纬度坐标构建
        LatLngBounds: function (southWest, northEast) {
            if (this instanceof shipxyMap.LatLngBounds) {
                if (!(southWest && southWest instanceof shipxyMap.LatLng) ||
                !(northEast && southWest instanceof shipxyMap.LatLng)) {
                    throw new Error(isen ? 'error param shipxyMap.LatLng' : 'shipxyMap.LatLngBounds构造函数参数不能为空，且必须是shipxyMap.LatLng的实例');
                }
                this.southWest = southWest; //西南角经纬度坐标
                this.northEast = northEast; //东北角经纬度坐标
            } else {
                return new shipxyMap.LatLngBounds(southWest, northEast);
            }
        },

        //像素坐标点，用于标注地图上的一个屏幕像素点
        Point: function (x, y) {
            if (this instanceof shipxyMap.Point) {
                if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
                    throw new Error(isen ? 'error param shipxyMap.Point' : 'shipxyMap.Point构造函数参数必须是有效数值');
                }
                this.x = x; //水平向右方向偏离坐标原点的值
                this.y = y; //垂直向下方向偏离坐标原点方向的值
            } else {
                return new shipxyMap.Point(x, y);
            }
        },

        //像素矩形区域大小，代表一对宽度和高度值
        Size: function (width, height) {
            if (this instanceof shipxyMap.Size) {
                if (typeof width !== 'number' || typeof height !== 'number' || isNaN(width) || isNaN(height)) {
                    throw new Error(isen ? 'error param shipxyMap.Size' : 'shipxyMap.Size构造函数参数必须是有效数值');
                }
                this.width = width; //矩形区域大小对象的宽度值，即点的x坐标差值
                this.height = height; //矩形区域大小对象的高度值，即点的y坐标差值
            } else {
                return new shipxyMap.Size(width, height);
            }
        },

        //地图所有叠加层的基类
        Overlay: function (id, options) {
            if (this instanceof shipxyMap.Overlay) {
                this.type = shipxyMap.OverlayType.OVERLAY; //叠加层类型常量，默认为'overlay'
                this.id = id || this.type + new Date().getTime() + Math.random(); //叠加层id，对象的唯一标识
                this.options = options || new shipxyMap.OverlayOptions(); //叠加物的参数选项
                if (typeof id !== 'string') {
                    throw new Error(isen ? 'error param shipxyMap.Overlay' : '请为shipxyMap.Overlay或其继承子类构造函数第一个参数指定为字符串值，而且应该是一个有效的能够唯一标识叠加物对象的ID');
                }
                if (!(options instanceof shipxyMap.OverlayOptions)) {
                    throw new Error(isen ? 'error second param shipxyMap.Overlay' : '请为shipxyMap.Overlay构造函数第二个参数指定为shipxyMap.OverlayOptions的一个实例，或者为空值采用默认内容');
                }
            } else {
                return new shipxyMap.Overlay(id, options);
            }
        },

        //所有叠加层构建时所需选项集的基类，包括了一些基本的共享属性。可以自由扩展各种叠加层子类所需的具体选项集
        OverlayOptions: function () {
            if (this instanceof shipxyMap.OverlayOptions) {
                this.zoomlevels = [1, 18]; //控制叠加层在地图上所需要显示的zoom序列，例如[1,10]表示叠加层在1到10级显示，其他级别不显示，默认1-18级
            } else {
                return new shipxyMap.OverlayOptions();
            }
        },

        //标识所有叠加层类型的常量列表
        OverlayType: {
            //默认，overlay
            OVERLAY: 'overlay',
            //船舶
            SHIP: 'ship',
            //轨迹
            TRACK: 'track',
            //点
            MARKER: 'marker',
            //折线
            POLYLINE: 'polyline',
            //多边形
            POLYGON: 'polygon'
        },

        //船舶叠加物类，继承于Overlay
        Ship: function (id, data, options) {
            if (this instanceof shipxyMap.Ship) {
                if (data && !(data instanceof shipxyAPI.Ship)) {
                    throw new Error(isen ? 'error second param shipxyMap.Ship' : '请为shipxyMap.Ship构造函数第二个参数指定为shipxyAPI.Ship的一个实例');
                }
                options = options || new shipxyMap.ShipOptions();
                if (!(options instanceof shipxyMap.ShipOptions)) {
                    throw new Error(isen ? 'error third param shipxyMap.Ship' : '请为shipxyMap.Ship构造函数第三个参数指定为shipxyMap.ShipOptions的一个实例，或者为空值采用默认内容');
                }
                //构造函数：继承Overlay实例上的属性
                shipxyMap.Overlay.call(this, id, options);
                this.type = shipxyMap.OverlayType.SHIP;
                this.data = data; //shipxyAPI.Ship,船舶数据，数据来源于shipxyAPI的请求
            } else {
                return new shipxyMap.Ship(id, data, options);
            }
        },

        //Ship构建时所需的选项集，继承于OverlayOptions
        ShipOptions: function () {
            if (this instanceof shipxyMap.ShipOptions) {
                //构造函数：继承OverlayOptions实例上的属性
                shipxyMap.OverlayOptions.call(this);
                this.isShowLabel = true; //是否显示船舶的船名标签，默认显示
                this.isShowMiniTrack = true; //是否显示船舶的三分钟轨迹，默认显示
                this.isSelected = false; //是否显示船舶外框选
                this.strokeStyle = new shipxyMap.StrokeStyle(); //控制船舶边线样式
                this.fillStyle = new shipxyMap.FillStyle(); //控制船舶的填充样式
                this.fillStyle.color = 0xffff00;
                this.labelOptions = new shipxyMap.LabelOptions(); //控制船名标签风格
            } else {
                return new shipxyMap.ShipOptions();
            }
        },

        //轨迹叠加物类，继承于Overlay
        Track: function (id, data, options) {
            if (this instanceof shipxyMap.Track) {
                if (data && !(data instanceof shipxyAPI.Track)) {
                    throw new Error(isen ? 'error second param shipxyMap.Track' : '请为shipxyMap.Track构造函数第二个参数指定为shipxyAPI.Track的一个实例');
                }
                options = options || new shipxyMap.TrackOptions();
                if (!(options instanceof shipxyMap.TrackOptions)) {
                    throw new Error(isen ? 'error third param shipxyMap.Track' : '请为shipxyMap.Track构造函数第三个参数指定为shipxyMap.TrackOptions的一个实例，或者为空值采用默认内容');
                }
                //构造函数：继承Overlay实例上的属性
                shipxyMap.Overlay.call(this, id, options);
                this.type = shipxyMap.OverlayType.TRACK;
                this.data = data; //shipxyAPI.Track,轨迹数据，数据来源于shipxyAPI的请求，其中包含了轨迹点数据列表等内容
            } else {
                return new shipxyMap.Track(id, data, options);
            }
        },

        //Track构建时所需的参数选项集，继承于OverlayOptions
        TrackOptions: function () {
            if (this instanceof shipxyMap.TrackOptions) {
                //构造函数：继承OverlayOptions实例上的属性
                shipxyMap.OverlayOptions.call(this);
                this.isShowLabel = true; //是否显示轨迹的时间标签，默认显示
                this.isVacuate = true; //是否需要对轨迹点进行抽稀处理，默认true需要抽稀
                this.distance = 50; //抽稀间距，像素值，默认50像素。当isVacuate=true时，此参数才有效
                this.pointStyle = new shipxyMap.PointStyle(); //控制轨迹点样式
                this.pointStyle.radius = 4; //轨迹点的半径大小，默认为4像素
                this.pointStyle.fillStyle.color = 0xFFFFFF; //轨迹点的背景颜色，默认为白色
                this.strokeStyle = new shipxyMap.StrokeStyle(); //控制轨迹线样式
                this.strokeStyle.thickness = 2; //轨迹线条粗细，默认为2像素
                this.labelOptions = new shipxyMap.LabelOptions(); //控制轨迹时间标签风格
            } else {
                return new shipxyMap.TrackOptions();
            }
        },

        //点叠加物类，继承于Overlay
        Marker: function (id, data, options) {
            if (this instanceof shipxyMap.Marker) {
                if (!data || !(data instanceof shipxyMap.LatLng)) {
                    throw new Error(isen ? 'error second param shipxyMap.LatLng' : '请为shipxyMap.Marker构造函数第二个参数指定内容，必须是shipxyMap.LatLng的一个实例');
                }
                options = options || new shipxyMap.MarkerOptions();
                if (!(options instanceof shipxyMap.MarkerOptions)) {
                    throw new Error(isen ? 'error third param shipxyMap.MarkerOptions' : '请为shipxyMap.Marker构造函数第三个参数指定为shipxyMap.MarkerOptions的一个实例，或者为空值采用默认内容');
                }
                //构造函数：继承Overlay实例上的属性
                shipxyMap.Overlay.call(this, id, options);
                this.type = shipxyMap.OverlayType.MARKER;
                this.data = data; //点的经纬度位置数据
            } else {
                return new shipxyMap.Marker(id, data, options);
            }
        },

        //Marker构建时所需的参数选项集，继承于OverlayOptions
        MarkerOptions: function () {
            if (this instanceof shipxyMap.MarkerOptions) {
                //构造函数：继承OverlayOptions实例上的属性
                shipxyMap.OverlayOptions.call(this);
                this.zIndex = shipxyMap.ZIndexConst.OVERLAY_LAYER; //叠加物添加到地图中的显示层级，默认4级
                this.imageUrl = ''; //标注图片/swf的URL
                this.imagePos = new shipxyMap.Point(0, 0); //图片中心点相对于标注位置的偏移位置
                this.isShowLabel = false; //是否显示描述标签，默认不显示
                this.isEditable = false; //是否可编辑，默认不可编辑
                this.labelOptions = new shipxyMap.LabelOptions(); //控制描述标签风格
                this.labelOptions.text = isen ? 'this is a point marker' : '这是一个点标注';
            } else {
                return new shipxyMap.MarkerOptions();
            }
        },

        //折线叠加物类，继承于Overlay
        Polyline: function (id, data, options) {
            if (this instanceof shipxyMap.Polyline) {
                if (!data || !(data instanceof Array)) {
                    throw new Error(isen ? 'error second param shipxyMap.Polyline' : '请为shipxyMap.Polyline构造函数第二个参数指定内容，一个数组，元素可以是shipxyMap.LatLng实例，也可以是如{lat:0,lng:0}格式的内容');
                }
                options = options || new shipxyMap.PolylineOptions();
                if (!(options instanceof shipxyMap.PolylineOptions)) {
                    throw new Error(isen ? 'error third param shipxyMap.Polyline' : '请为shipxyMap.Polyline构造函数第三个参数指定为shipxyMap.PolylineOptions的一个实例，或者为空值采用默认内容');
                }
                var obj, len = data.length;
                for (var i = 0; i < len; i++) {
                    obj = data[i];
                    if (!(obj instanceof shipxyMap.LatLng)) {
                        data[i] = new shipxyMap.LatLng(obj.lat, obj.lng);
                    }
                }
                //构造函数：继承Overlay实例上的属性
                shipxyMap.Overlay.call(this, id, options);
                this.type = shipxyMap.OverlayType.POLYLINE;
                this.data = data; //折线的各个顶点坐标，不能小于2个
            } else {
                return new shipxyMap.Polyline(id, data, options);
            }
        },

        //Polyline构建时所需的参数选项集，继承于OverlayOptions
        PolylineOptions: function () {
            if (this instanceof shipxyMap.PolylineOptions) {
                //构造函数：继承OverlayOptions实例上的属性
                shipxyMap.OverlayOptions.call(this);
                this.zIndex = shipxyMap.ZIndexConst.OVERLAY_LAYER; //叠加物添加到地图中的显示层级，默认4级
                this.isShowLabel = false; //是否显示描述标签，默认不显示
                this.isEditable = false; //是否可编辑，默认不可编辑
                this.strokeStyle = new shipxyMap.StrokeStyle(); //控制线条样式
                this.strokeStyle.color = 0x0066A7;
                this.strokeStyle.thickness = 2; //线条粗细，默认为2像素
                this.labelOptions = new shipxyMap.LabelOptions(); //控制描述标签风格
                this.labelOptions.text = isen ? 'this is a polyline' : '这是一条折线';
            } else {
                return new shipxyMap.PolylineOptions();
            }
        },

        //多边形叠加物类，继承于Overlay
        Polygon: function (id, data, options) {
            if (this instanceof shipxyMap.Polygon) {
                if (!data || !(data instanceof Array)) {
                    throw new Error(isen ? 'error second param shipxyMap.Polygon' : '请为shipxyMap.Polygon构造函数第二个参数指定内容，一个数组，元素可以是shipxyMap.LatLng实例，也可以是如{lat:0,lng:0}格式的内容');
                }
                options = options || new shipxyMap.PolygonOptions();
                if (!(options instanceof shipxyMap.PolygonOptions)) {
                    throw new Error(isen ? 'error third param shipxyMap.Polygon' : '请为shipxyMap.Polygon构造函数第三个参数指定为shipxyMap.PolygonOptions的一个实例，或者为空值采用默认内容');
                }
                var obj, len = data.length;
                for (var i = 0; i < len; i++) {
                    obj = data[i];
                    if (!(obj instanceof shipxyMap.LatLng)) {
                        data[i] = new shipxyMap.LatLng(obj.lat, obj.lng);
                    }
                }
                //构造函数：继承Overlay实例上的属性
                shipxyMap.Overlay.call(this, id, options);
                this.type = shipxyMap.OverlayType.POLYGON;
                this.data = data; //多边形的各个顶点坐标，不能小于3个
            } else {
                return new shipxyMap.Polygon(id, data, options);
            }
        },

        //Polygon构建时所需的参数选项集，继承于OverlayOptions
        PolygonOptions: function () {
            if (this instanceof shipxyMap.PolygonOptions) {
                //构造函数：继承OverlayOptions实例上的属性
                shipxyMap.OverlayOptions.call(this);
                this.zIndex = shipxyMap.ZIndexConst.OVERLAY_LAYER; //叠加物添加到地图中的显示层级，默认4级
                this.isShowLabel = false; //是否显示描述标签，默认不显示
                this.isEditable = false; //是否可编辑，默认不可编辑
                this.strokeStyle = new shipxyMap.StrokeStyle(); //控制线条样式
                this.strokeStyle.color = 0x0066A7;
                this.strokeStyle.thickness = 2; //线条粗细，默认为2像素
                this.fillStyle = new shipxyMap.FillStyle(); //控制填充样式
                this.fillStyle.color = 0x0000FF; //填充色，默认为红色
                this.fillStyle.alpha = 0.2; //填充透明度，默认0.2
                this.labelOptions = new shipxyMap.LabelOptions(); //控制描述标签风格
                this.labelOptions.text = isen ? 'this is a polygon' : '这是一个多边形';
            } else {
                return new shipxyMap.PolygonOptions();
            }
        },

        //定义文本标签风格
        LabelOptions: function () {
            if (this instanceof shipxyMap.LabelOptions) {
                shipxyMap.OverlayOptions.call(this);
                this.text = ''; //标签文本，原样显示文本内容
                this.htmlText = ''; //标签文本，可以携带基本的html标签，以修饰文本内容
                this.labelPosition = new shipxyMap.Point(0, 0); //文本相对于标签左上角的偏移量
                this.fontStyle = new shipxyMap.FontStyle(); //控制标签字体风格
                this.border = true; //是否有边框
                this.background = false; //是否有背景
                this.borderStyle = new shipxyMap.StrokeStyle(); //边框样式
                this.backgroundStyle = new shipxyMap.FillStyle(); //背景样式
            } else {
                return new shipxyMap.LabelOptions();
            }
        },

        //定义点样式
        PointStyle: function () {
            if (this instanceof shipxyMap.PointStyle) {
                this.radius = 1; //点的半径大小，单位是像素
                this.strokeStyle = new shipxyMap.StrokeStyle(); //点的线条样式
                this.fillStyle = new shipxyMap.FillStyle(); //点的背景填充样式
            } else {
                return new shipxyMap.PointStyle();
            }
        },

        //定义线条样式
        StrokeStyle: function () {
            if (this instanceof shipxyMap.StrokeStyle) {
                this.thickness = 1; //线的粗细度
                this.color = 0; //线的颜色值，0x00000~0xFFFFFF
                this.alpha = 1; //线的透明度，0.0~1.0
            } else {
                return new shipxyMap.StrokeStyle();
            }
        },

        //定义填充样式
        FillStyle: function () {
            if (this instanceof shipxyMap.FillStyle) {
                this.color = 0; //填充颜色值，0x00000~0xFFFFFF
                this.alpha = 1; //填充的透明度，0.0~1.0
            } else {
                return new shipxyMap.FillStyle();
            }
        },

        //定义字体样式
        FontStyle: function () {
            if (this instanceof shipxyMap.FontStyle) {
                this.name = 'Verdana'; //字体的名称，默认为Verdana
                this.size = 11; //字体的大小
                this.color = 0; //字体的颜色值，0x00000~0xFFFFFF
                this.bold = false; //是否为粗体
                this.italic = false; //是否为斜体
                this.underline = false; //是否有下划线
            } else {
                return new shipxyMap.FontStyle();
            }
        },

        //地图事件类，定义一些地图事件类型的常量值
        Event: function () {
            if (this instanceof shipxyMap.Event) {
                this.mapId = ''; //当前地图id
                this.overlayId = ''; //叠加物id
                this.type = ''; //事件类型
                this.latLng = null; //经纬度坐标
                this.zoom = NaN; //地图当前zoom级别
                this.extendData = null; //额外数据
            } else {
                return new shipxyMap.Event();
            }
        },

        //JS与AS通信
        JS_AS: {
            //添加js/as通信回调函数的钩子，相同回调函数只添加一次
            addCallbackHook: function (fn) {
                if (fn && fn instanceof Function) {
                    var name = '', flag = false;
                    for (var key in jsCallbackHook) {
                        if (jsCallbackHook[key] == fn) {
                            name = key; flag = true;
                            break;
                        }
                    }
                    if (!flag) {
                        name = 'jscallback:' + new Date().getTime() + Math.random(); //生成唯一函数钩子名
                        jsCallbackHook[name] = fn; //钩上回调函数
                    }
                    return [shipxyMap.name + '.JS_AS.callCallbackHook', name]; //返回AS需要回调的JS函数名，并把钩子名作为回调参数传递给AS
                }
            },

            //as调用js/as通信回调钩子映射的回调函数
            callCallbackHook: function () {
                var fnName = arguments[0];
                if (jsCallbackHook[fnName]) {
                    jsCallbackHook[fnName].apply(this, arguments); //调用回调函数
                    delete jsCallbackHook[fnName]; //调用完毕，删除钩子
                } else {
                    if (this[fnName]) this[fnName].apply(this, arguments);
                }
            },

            //添加js/as事件处理函数钩子，相同事件处理函数只添加一次
            addJSEventHook: function (handler) {
                if (handler && handler instanceof Function) {
                    var name = '', flag = false;
                    for (var key in jsEventHook) {
                        if (jsEventHook[key] == handler) {
                            name = key; flag = true;
                            break;
                        }
                    }
                    if (!flag) {
                        name = 'jsevent:' + new Date().getTime() + Math.random();
                        jsEventHook[name] = handler;
                    }
                    return [shipxyMap.name + '.JS_AS.callJSEventHook', name];
                }
            },

            //调用js/as事件钩子映射的事件处理函数
            callJSEventHook: function (handlerName, event) {
                var e = new shipxyMap.Event();
                if (event.mapId) {
                    e.mapId = event.mapId;
                }
                if (event.overlayId) {
                    e.overlayId = event.overlayId;
                }
                if (event.type) {
                    e.type = event.type;
                }
                if (event.lat && event.lng) {
                    e.latLng = new shipxyMap.LatLng(event.lat, event.lng);
                }
                if (event.zoom) {
                } e.zoom = event.zoom;
                if (event.extendData) {
                    e.extendData = event.extendData;
                }
                jsEventHook[handlerName].call(this, e);
            },

            //删除js/as事件处理函数钩子
            removeJSEventHook: function (handler) {
                if (handler && handler instanceof Function) {
                    var name = '';
                    for (var key in jsEventHook) {
                        if (jsEventHook[key] == handler) {
                            name = key;
                            delete jsEventHook[name];
                            return [shipxyMap.name + '.JS_AS.callJSEventHook', name];
                        }
                    }
                    return null;
                }
            },

            //供as在浏览器控制台打印信息
            log: function (msg) {
                console.log('log from flash:' + msg);
            }
        },

        //描述叠加物的显示层级
        ZIndexConst: {
            //地图层： 显示层级最低，在船舶层之下
            MAP_LAYER: 1,
            //船舶层：显示在地图之上，轨迹层之下
            SHIP_LAYER: 2,
            //轨迹层：显示在船舶层之上，其他叠加物层之下
            TRACK_LAYER: 3,
            //其他叠加物层：显示在轨迹层之上，显示层级最高
            OVERLAY_LAYER: 4
        }
    }

    //定义Map的方法
    shipxyMap.Map.prototype = {
        /**
        * 设置地图中心点坐标和缩放级别，地图将会自动被定为到该中心点和缩放级别
        * latLng:LatLng 经纬度坐标
        * zoom:Number地图缩放的级别，范围为[1,18]，默认可不传，表示不对缩放级别进行更改，保持地图当前缩放级别不变
        **/
        setCenter: function (latLng, zoom) {
            if (latLng && latLng instanceof shipxyMap.LatLng) {
                var isNumber = typeof zoom == 'number';
                if (zoom && !isNumber) {
                    throw new Error(isen ? 'error second param value' : '请为setCenter方法第二个参数指定为一个数值或者不传');
                } else if (isNumber) {
                    zoom = Math.round(zoom);
                    if (isNaN(zoom) || zoom < 1 || zoom > 18) {
                        throw new Error(isen ? 'second param value must in [1-18]' : 'setCenter方法第二个参数的数值范围必须是1~18之间的整数或者不传');
                    }
                }
                try {
                    flash.setCenter(toObject(latLng), zoom);
                    this.center = latLng;
                    if (zoom) {
                        this.zoom = zoom;
                    }
                } catch (err) {
                    throwFlashError('setCenter', err.message);
                };
            } else {
                throw new Error(isen ? 'param must be an instanceof shipxyMap.LatLng' : "setCenter方法参数错误，参数latLng不能为空，且必须是shipxyMap.LatLng的一个实例");
            }
        },

        /**返回地图当前中心点经纬度位置**/
        getCenter: function () {
            if (!this.initialized) {
                return this.center;
            }
            try {
                var latLng = flash.getCenter();
                if (latLng) {
                    this.center.lat = latLng.lat;
                    this.center.lng = latLng.lng;
                    return this.center;
                }
                return null;
            } catch (err) {
                throwFlashError('getCenter', err.message);
            };
        },

        /**
        * 设置地图的缩放级别，地图将会自动缩放到该级别，中心点不变
        * zoom: Number地图缩放的级别，范围为[1,18]
        **/
        setZoom: function (zoom) {
            if (typeof zoom != 'number' || isNaN(zoom)) {
                throw new Error(isen ? 'param must in [1-18]' : '请为setZoom方法参数指定为一个1~18之间的整数值');
            } else {
                zoom = Math.round(zoom);
                if (zoom < 1 || zoom > 18) {
                    throw new Error(isen ? 'param must in [1-18]' : 'setZoom方法参数的数值范围必须是1~18之间的整数');
                }
            }
            try {
                flash.setZoom(zoom);
                this.zoom = zoom;
            } catch (err) {
                throwFlashError('setZoom', err.message);
            };
        },

        /**返回地图当前缩放级别**/
        getZoom: function () {
            if (!this.initialized) {
                return this.zoom;
            }
            try {
                this.zoom = flash.getZoom();
                return this.zoom;
            } catch (err) {
                throwFlashError('getZoom', err.message);
            };
        },

        /**
        * 设置地图类型
        * mapType:String地图类型，MapType列出的常量之一。非必填项，如果不填或者传入null/空字符，则默认为Google地图
        **/
        setMapType: function (mapType) {
            mapType = mapType || shipxyMap.MapType.GOOGLEMAP;
            if (typeof mapType != 'string') {
                throw new Error(isen ? 'param need a string or empty' : '请为setMapType方法参数指定为一个字符串值或者不传');
            } else {
                var types = shipxyMap.MapType;
                var f = false;
                for (var k in types) {
                    if (mapType == types[k]) {
                        f = true;
                        break;
                    }
                }
                if (!f) {
                    throw new Error(isen ? 'param must b a typeof shipxyMap.MapType' : 'setMapType方法参数必须是shipxyMap.MapType所列出的地图类型之一，注意大小写');
                }
            }
            try {
                flash.setMapType(mapType);
                this.mapType = mapType;
            } catch (err) {
                throwFlashError('setMapType', err.message);
            };
        },

        /**返回当前地图类型**/
        getMapType: function () {
            if (!this.initialized) {
                return this.mapType;
            }
            try {
                this.mapType = flash.getMapType();
                return this.mapType;
            } catch (err) {
                throwFlashError('getMapType', err.message);
            };
        },

        /**返回地图当前可视范围的像素区域大小**/
        getSize: function () {
            if (!this.initialized) { return null; }
            try {
                var obj = flash.getSize();
                if (obj) {
                    return new shipxyMap.Size(obj.width, obj.height);
                }
                return null;
            } catch (err) {
                throwFlashError('getSize', err.message);
            };
        },

        /**返回地图当前可视范围的经纬度区域大小**/
        getLatLngBounds: function () {
            if (!window.flash) { return null; }
            try {
                var obj = flash.getLatLngBounds();
                if (obj) {
                    var sw = new shipxyMap.LatLng(obj.southWest.lat, obj.southWest.lng);
                    var ne = new shipxyMap.LatLng(obj.northEast.lat, obj.northEast.lng);
                    return new shipxyMap.LatLngBounds(sw, ne);
                }
                return null;
            } catch (err) {
                throwFlashError('getLatLngBounds', err.message);
            };
        },

        /**对地图放大一个级别**/
        zoomIn: function () {
            try {
                return flash.zoomIn();
            } catch (err) {
                throwFlashError('zoomIn', err.message);
            };
        },

        /**对地图缩小一个级别**/
        zoomOut: function () {
            try {
                return flash.zoomOut();
            } catch (err) {
                throwFlashError('zoomOut', err.message);
            };
        },

        /**
        * 平移地图中心点到指定的经纬度位置
        * center:LatLng 平移后的地图经纬度中心点
        **/
        panTo: function (center) {
            if (center && center instanceof shipxyMap.LatLng) {
                try {
                    flash.panTo(toObject(center));
                } catch (err) {
                    throwFlashError('panTo', err.message);
                };
            } else {
                throw new Error(isen ? 'param must be a instanceof shipxyMap.LatLng' : 'panTo方法参数错误，参数不能为空，且必须是shipxyMap.LatLng的一个实例');
            }
        },

        /**
        * 对地图平移指定的偏移量
        * offset:Size 地图需要平移的偏移量，像素值
        **/
        panBy: function (offset) {
            if (offset && offset instanceof shipxyMap.Size) {
                try {
                    flash.panBy(toObject(offset));
                } catch (err) {
                    throwFlashError('panBy', err.message);
                };
            } else {
                throw new Error(isen ? 'param must be a instanceof shipxyMap.Size' : 'panBy方法参数错误，参数不能为空，且必须是shipxyMap.Size的一个实例');
            }
        },

        /**
        * 向地图上添加一个叠加物，比如添加一条船舶
        * overlay:Overlay 叠加物对象
        * isTop: boolean 默认false  是否优先显示
        **/
        addOverlay: function (overlay, isTop) {
            if (overlay && overlay instanceof shipxyMap.Overlay) {
                if (isTop != undefined && typeof isTop != 'boolean') {
                    throw new Error(isen ? 'second param must be boolean or empty' : 'addOverlay方法第二个参数错误，需要是布尔值或者不填');
                }
                try {
                    flash.addOverlay(toObject(overlay), isTop);
                    overlayList[overlay.id] = overlay;
                } catch (err) {
                    throwFlashError('addOverlay', err.message);
                };
            } else {
                throw new Error(isen ? 'param must be a instanceof shipxyMap.Overlay' : 'addOverlay方法参数错误，参数不能为空，且必须是shipxyMap.Overlay或其子类的一个实例');
            }
        },

        /**
        * 向地图上批量添加一组叠加物
        * overlays:Array 一组叠加物，各个叠加物可以不是同一类型的
        **/
        addOverlays: function (overlays) {
            if (overlays && overlays instanceof Array) {
                for (var i = 0, len = overlays.length; i < len; i++) {
                    this.addOverlay(overlays[i]);
                }
            } else {
                throw new Error(isen ? 'param must be a instanceof Array' : 'addOverlays方法参数错误，参数不能为空，且必须是Array数组实例');
            }
        },

        /**
        * 从地图上删除一个叠加物
        * overlay:Overlay地图上一个叠加物对象
        **/
        removeOverlay: function (overlay) {
            if (overlay && overlay instanceof shipxyMap.Overlay) {
                try {
                    flash.removeOverlay(toObject(overlay));
                    delete overlayList[overlay.id];
                } catch (err) {
                    throwFlashError('removeOverlay', err.message);
                };
            } else {
                throw new Error(isen ? 'param must be a instanceof shipxyMap.Overlay' : 'removeOverlay方法参数错误，参数不能为空，且必须是shipxyMap.Overlay或其子类的一个实例');
            }
        },

        /**
        * 批量删除地图上叠加物组
        * overlays: Array 地图上叠加物组
        **/
        removeOverlays: function (overlays) {
            if (overlays && overlays instanceof Array) {
                for (var i = 0, len = overlays.length; i < len; i++) {
                    this.removeOverlay(overlays[i]);
                }
            } else {
                throw new Error(isen ? 'param must be a instanceof Array' : 'removeOverlays方法参数错误，参数不能为空，且必须是Array数组实例');
            }
        },

        /**
        * 通过叠加物id从地图上删除该叠加物对象
        * overlayId:String 叠加物id
        **/
        removeOverlayById: function (overlayId) {
            if (overlayId && typeof overlayId == 'string') {
                this.removeOverlay(this.getOverlayById(overlayId));
            } else {
                throw new Error(isen ? 'param must be a uniq string' : 'removeOverlayById方法参数错误，参数不能为空，且必须是字符串值，而且应该是一个有效的能够唯一标识叠加物对象的ID');
            }
        },

        /**
        * 通过叠加物类型删除该类型的所有叠加物。比如可以通过此方法删除所有船舶
        * overlayType:String 叠加物类型，比如’ship’
        **/
        removeOverlayByType: function (overlayType) {
            if (overlayType && typeof overlayType == 'string') {
                var types = shipxyMap.OverlayType;
                var f = false;
                for (var k in types) {
                    if (overlayType == types[k]) {
                        f = true;
                        break;
                    }
                }
                if (!f) {
                    throw new Error(isen ? 'param must be typeof shipxyMap.OverlayType' : 'removeOverlayByType方法参数错误，参数必须是shipxyMap.OverlayType所列出的叠加物类型之一，注意大小写');
                }
                this.removeOverlays(this.getOverlayByType(overlayType));
            } else {
                throw new Error(isen ? 'param must be string' : 'removeOverlayByType方法参数错误，参数不能为空，且必须是字符串值');
            }
        },

        /**删除地图上所有叠加物**/
        removeAllOverlay: function () {
            for (var i in overlayList) {
                var o = overlayList[i];
                if (!(o instanceof Function)) {
                    this.removeOverlay(overlayList[i]);
                }
            }
            overlayList = {};
        },

        /**
        * 通过叠加物id获取该叠加物对象
        * overlayId:String 叠加物id
        * 返回：该叠加物，若地图上没有该叠加物，则返回null值
        **/
        getOverlayById: function (overlayId) {
            if (overlayId && typeof overlayId == 'string') {
                var overlay = overlayList[overlayId];
                if (overlay) {
                    if (overlay.type == shipxyMap.OverlayType.MARKER ||
                    overlay.type == shipxyMap.OverlayType.POLYLINE ||
                    overlay.type == shipxyMap.OverlayType.POLYGON) {
                        var obj = flash.getOverlay(overlayId);
                        if (obj) {
                            var data, opts;
                            switch (obj.type) {
                                case shipxyMap.OverlayType.MARKER:
                                    overlay.data.lat = obj.data.lat;
                                    overlay.data.lng = obj.data.lng;
                                    break;
                                case shipxyMap.OverlayType.POLYLINE:
                                case shipxyMap.OverlayType.POLYGON:
                                    var points = [], d = obj.data, o;
                                    for (var i = 0, len = d.length; i < len; i++) {
                                        o = d[i];
                                        points.push(new shipxyMap.LatLng(o.lat, o.lng));
                                    }
                                    overlay.data = points;
                                    break;
                            }
                        }
                    }
                }
                return overlay;
            } else {
                throw new Error(isen ? 'param must be a uniq string' : 'getOverlayById方法参数错误，参数不能为空，且必须是字符串值，而且应该是一个有效的能够唯一标识叠加物对象的ID');
            }
        },

        /**
        * 通过叠加物类型获取该类型的所有叠加物
        * overlayType:String 叠加物类型
        * 返回：该类型叠加物数组，若地图上没有任何该类型的叠加物，则返回空数组
        **/
        getOverlayByType: function (overlayType) {
            if (overlayType && typeof overlayType == 'string') {
                var types = shipxyMap.OverlayType;
                var f = false;
                for (var k in types) {
                    if (overlayType == types[k]) {
                        f = true;
                        break;
                    }
                }
                if (!f) {
                    throw new Error(isen ? 'param must be typeof shipxyMap.OverlayType' : 'getOverlayByType方法参数错误，参数必须是shipxyMap.OverlayType所列出的叠加物类型之一，注意大小写');
                }
                var os = [], o = null;
                for (var id in overlayList) {
                    o = overlayList[id];
                    if (o && o.type == overlayType) {
                        os.push(this.getOverlayById(id));
                    }
                }
                return os;
            } else {
                throw new Error(isen ? 'param must be string' : 'getOverlayByType方法参数错误，参数不能为空，且必须是字符串值');
            }
        },

        /**
        * 定位该叠加物到地图中心点位置
        * overlay:Overlay 叠加物
        * zoom:Number 定位叠加物到指定级别，若不传：如果是船舶之类的点位置叠加物，则保持不变；若是轨迹之类的线或多边形叠加物，则API将会根据线或多边形的外接矩形计算一个最合适的级别
        **/
        locateOverlay: function (overlay, zoom) {
            if (overlay && overlay instanceof shipxyMap.Overlay) {
                var isNumber = typeof zoom == 'number';
                if (zoom && !isNumber) {
                    throw new Error(isen ? 'second param must be int or empty' : '请为locateOverlay方法第二个参数指定为一个数值或者不传');
                } else if (isNumber) {
                    zoom = Math.round(zoom);
                    if (isNaN(zoom) || zoom < 1 || zoom > 18) {
                        throw new Error(isen ? 'second param value must be in [1-18]' : 'locateOverlay方法第二个参数的数值范围必须是1~18之间的整数或者不传');
                    }
                }
                try {
                    flash.locateOverlay(toObject(overlay), zoom);
                } catch (err) {
                    throwFlashError('locateOverlay', err.message);
                };
            } else {
                throw new Error(isen ? 'param must be a instanceof shipxyMap.Overlay' : 'locateOverlay方法参数错误，第一个参数不能为空，且必须是shipxyMap.Overlay或其子类的一个实例');
            }
        },

        /**
        * 通过叠加物id定位该叠加物对象到地图中心点位置
        * overlayId:String 叠加物id
        * zoom:Number 定位叠加物到指定级别，若不传：如果是船舶之类的点位置叠加物，则保持不变；若是轨迹之类的线或多边形叠加物，则API将会根据线或多边形的外接矩形计算一个最合适的级别
        **/
        locateOverlayById: function (overlayId, zoom) {
            if (overlayId && typeof overlayId == 'string') {
                this.locateOverlay(this.getOverlayById(overlayId), zoom);
            } else {
                throw new Error(isen ? 'param must be a uniq string' : 'locateOverlayById方法参数错误，第一个参数不能为空，且必须是字符串值，而且应该是一个有效的能够唯一标识叠加物对象的ID');
            }
        },

        /**
        * 通过叠加物类型定位该类型的所有叠加物，比如可以通过此方法定位所有船舶
        * 首先通过计算得到一个囊括该类型所有叠加物的大矩形，然后定位到该大矩形的中心点处
        * overlayType:String 叠加物类型，比如’ship’
        * zoom:Number 定位叠加物到指定级别，若不传，API将会根据大矩形计算一个最合适的级别
        **/
        locateOverlayByType: function (overlayType, zoom) {
            if (overlayType && typeof overlayType == 'string') {
                var types = shipxyMap.OverlayType;
                var f = false;
                for (var k in types) {
                    if (overlayType == types[k]) {
                        f = true;
                        break;
                    }
                }
                if (!f) {
                    throw new Error(isen ? 'param must be a instanceof shipxyMap.OverlayType' : 'removeOverlayByType方法参数错误，参数必须是shipxyMap.OverlayType所列出的叠加物类型之一，注意大小写');
                }
                this.locateOverlays(this.getOverlayByType(overlayType), zoom);
            } else {
                throw new Error(isen ? 'param must be a string' : 'locateOverlayByType方法参数错误，参数不能为空，且必须是字符串值');
            }
        },

        /**
        * 批量定位一组叠加物到地图中心点
        * 首先通过计算得到一个囊括该组叠加物的大矩形，然后定位到该大矩形的中心点处
        * overlays:Array一组叠加物
        * zoom:Number 定位叠加物到指定级别，若不传，API将会根据大矩形计算一个最合适的级别
        **/
        locateOverlays: function (overlays, zoom) {
            if (overlays && overlays instanceof Array) {
                var isNumber = typeof zoom == 'number';
                if (zoom && !isNumber) {
                    throw new Error(isen ? 'second param must be a string or empty' : '请为locateOverlays方法第二个参数指定为一个数值或者不传');
                } else if (isNumber) {
                    zoom = Math.round(zoom);
                    if (isNaN(zoom) || zoom < 1 || zoom > 18) {
                        throw new Error(isen ? 'second param value must be in [1-18]' : 'locateOverlays方法第二个参数的数值范围必须是1~18之间的整数或者不传');
                    }
                }
                var d = [], o = null;
                for (var i in overlays) {
                    o = overlays[i];
                    if (!(o instanceof Function)) {
                        if (o instanceof shipxyMap.Overlay) {
                            d.push(toObject(o));
                        } else {
                            throw new Error(isen ? 'param must be a instanceof shipxyMap.Overlay' : 'locateOverlays方法参数错误，第一个参数的数组元素必须是shipxyMap.Overlay或其子类的实例');
                        }
                    }
                }
                try {
                    flash.locateOverlays(d, zoom);
                } catch (err) {
                    throwFlashError('locateOverlays', err.message);
                };
            } else {
                throw new Error(isen ? 'param must be a instanceof Array' : 'locateOverlays方法参数错误，第一个参数不能为空，且必须是Array数组实例');
            }
        },

        /**
        * 将点的经纬度坐标转换为地图容器的屏幕像素坐标
        * latLng:LatLng 经纬度坐标
        * 返回：Flash地图所在容器的像素坐标
        **/
        fromLatLngToPoint: function (latLng) {
            if (latLng && latLng instanceof shipxyMap.LatLng) {
                try {
                    var p = flash.fromLatLngToPoint(toObject(latLng));
                    if (p) {
                        return new shipxyMap.Point(p.x, p.y);
                    }
                    return null;
                } catch (err) {
                    throwFlashError('fromLatLngToPoint', err.message);
                };
            } else {
                throw new Error(isen ? 'param must be a instanceof shipxyMap.LatLng' : 'fromLatLngToPoint方法参数错误，参数不能为空，且必须是shipxyMap.LatLng的一个实例');
            }
        },

        /**
        * 将点的屏幕像素坐标转换为经纬度坐标
        * point:Point 在Flash地图所在容器中点的像素坐标
        * 返回：经纬度坐标
        **/
        fromPointToLatLng: function (point) {
            if (point && point instanceof shipxyMap.Point) {
                try {
                    var ll = flash.fromPointToLatLng(toObject(point));
                    if (ll) {
                        return new shipxyMap.LatLng(ll.lat, ll.lng);
                    }
                    return null;
                } catch (err) {
                    throwFlashError('fromPointToLatLng', err.message);
                };
            } else {
                throw new Error(isen ? 'param must be a instanceof shipxyMap.Point' : 'fromPointToLatLng方法参数错误，参数不能为空，且必须是shipxyMap.Point的一个实例');
            }
        },

        /**
        * 注册一个地图事件，当该地图事件被触发时，执行listener函数
        * target:Map/Overlay 监听的对象，可以是地图本身，也可以是指定的叠加物
        * type: String地图事件
        * listener:Function 注册的回调处理函数，当该eventType事件被触发时，执行此函数
        **/
        addEventListener: function (target, type, listener) {
            if ((target && (target instanceof shipxyMap.Map || target instanceof shipxyMap.Overlay))
                && (type && typeof type == 'string')
                && (listener && listener instanceof Function)) {
                try {
                    var hook = shipxyMap.JS_AS.addJSEventHook(listener);
                    if (hook) {
                        flash.addEventListener(target.id, type, hook);
                    }
                } catch (err) {
                    throwFlashError('addEventListener', err.message);
                };
            } else {
                throw new Error(isen ? 'param error' : 'addEventListener方法参数错误，三个参数都不能为空，第一个参数是shipxyMap.Map/shipxyMap.Overlay或其子类的实例，第二个参数是事件类型，第三个参数是事件回调函数');
            }
        },

        /**注销一个地图事件**/
        removeEventListener: function (target, type, listener) {
            if ((target && (target instanceof shipxyMap.Map || target instanceof shipxyMap.Overlay))
                && (type && typeof type == 'string')
                && (listener && listener instanceof Function)) {
                try {
                    var hook = shipxyMap.JS_AS.removeJSEventHook(listener);
                    if (hook) {
                        flash.removeEventListener(target.id, type, hook);
                    }
                } catch (err) {
                    throwFlashError('removeEventListener', err.message);
                };
            } else {
                throw new Error(isen ? 'param error' : 'removeEventListener方法参数错误，三个参数都不能为空，第一个参数是shipxyMap.Map/shipxyMap.Overlay或其子类的实例，第二个参数是事件类型值，第三个参数是事件回调函数');
            }
        },

        /**
        * 多次添加将覆盖
        **/
        addShipEventListener: function (type, listener) {
            if ((type && typeof type == 'string') && (listener && listener instanceof Function)) {
                try {
                    var hook = shipxyMap.JS_AS.addJSEventHook(listener);
                    if (hook) {
                        flash.addShipEventListener(type, hook);
                    }
                } catch (err) {
                    throwFlashError('addShipEventListener', err.message);
                };
            } else {
                throw new Error(isen ? 'param error' : 'addShipEventListener方法参数不正确');
            }
        },

        removeShipEventListener: function (type, listener) {
            if ((type && typeof type == 'string') && (listener && listener instanceof Function)) {
                try {
                    var hook = shipxyMap.JS_AS.removeJSEventHook(listener);
                    if (hook) {
                        //不需要销毁注册函数
                        flash.removeShipEventListener(type, hook);
                    }
                } catch (err) {
                    throwFlashError('removeShipEventListener', err.message);
                };
            } else {
                throw new Error(isen ? 'param error' : 'removeShipEventListener方法参数不正确');
            }
        },
        //点线面事件
        addGraphEventListener: function (type, listener) {
            if ((type && typeof type == 'string') && (listener && listener instanceof Function)) {
                try {
                    var hook = shipxyMap.JS_AS.addJSEventHook(listener);
                    if (hook) {
                        flash.addGraphEventListener(type, hook);
                    }
                } catch (err) {
                    throwFlashError('addGraphEventListener', err.message);
                };
            } else {
                throw new Error(isen ? 'param error' : 'addGraphEventListener方法参数不正确');
            }
        },

        removeGraphEventListener: function (type, listener) {
            if ((type && typeof type == 'string') && (listener && listener instanceof Function)) {
                try {
                    var hook = shipxyMap.JS_AS.removeJSEventHook(listener);
                    if (hook) {
                        //不需要销毁注册函数
                        flash.removeGraphEventListener(type, hook);
                    }
                } catch (err) {
                    throwFlashError('removeGraphEventListener', err.message);
                };
            } else {
                throw new Error(isen ? 'param error' : 'removeGraphEventListener方法参数不正确');
            }
        },

        /**绘制区域 有参数**/
        drawBound: function (lats, lngs, editable, isShowLineAnchor) {
            if (lats != "undefined" && lngs != "undefined" && editable != "undefined" && isShowLineAnchor != "undefined" && (typeof editable == 'boolean') && (typeof isShowLineAnchor == 'boolean') && (typeof lats == 'string') && (typeof lngs == 'string')) {
                try {
                    return flash.drawBound(lats, lngs, editable, isShowLineAnchor);
                } catch (err) {
                    throwFlashError('drawBound', err.message);
                };
            } else {
                throw new Error(isen ? 'param error' : 'drawBound方法参数不正确');
            }

        },
        /**绘制区域 无参数**/
        drawAreaBound: function () {
            try {
                return flash.drawAreaBound();
            } catch (err) {
                throwFlashError('drawAreaBound', err.message);
            };

        },
        /**返回绘制区域经纬度集合**/
        getAreaBound: function () {
            if (!this.initialized) {
                return null;
            }
            try {
                var bounds = flash.getAreaBound();
                if (bounds) {
                    this.areaBounds = JSON.parse(bounds);
                    return this.areaBounds;
                }
                return null;
            } catch (err) {
                throwFlashError('getAreaBound', err.message);
            };
        },
        /*绘制并显示指定bound*/
        createAreaBound: function (bounds) {
            if (bounds) {
                try {
                    return flash.createAreaBound(bounds);
                } catch (err) {
                    throwFlashError('createAreaBound', err.message);
                };

            } else {
                throw new Error(isen ? 'param error' : 'createAreaBound方法参数不正确');
            }
        }

    }

    //定义LatLng的方法
    shipxyMap.LatLng.prototype = {
        /**复制，返回一个副本**/
        clone: function () {
            return new shipxyMap.LatLng(this.lat, this.lng);
        }
    }

    //定义LatLngBounds的方法
    shipxyMap.LatLngBounds.prototype = {
        /**复制，返回一个副本**/
        clone: function () {
            return new shipxyMap.LatLngBounds(this.southWest.clone(), this.northEast.clone());
        }
    }

    //定义Point的方法
    shipxyMap.Point.prototype = {
        /**复制，返回一个副本**/
        clone: function () {
            return new shipxyMap.Point(this.x, this.y);
        }
    }

    //定义Size的方法
    shipxyMap.Size.prototype = {
        /**复制，返回一个副本**/
        clone: function () {
            return new shipxyMap.Size(this.width, this.height);
        }
    }

    //Ship继承Overlay原型上的方法
    inherit(shipxyMap.Ship, shipxyMap.Overlay);
    inherit(shipxyMap.ShipOptions, shipxyMap.OverlayOptions);
    inherit(shipxyMap.Track, shipxyMap.Overlay);
    inherit(shipxyMap.TrackOptions, shipxyMap.OverlayOptions);
    inherit(shipxyMap.Marker, shipxyMap.Overlay);
    inherit(shipxyMap.MarkerOptions, shipxyMap.OverlayOptions);
    inherit(shipxyMap.Polyline, shipxyMap.Overlay);
    inherit(shipxyMap.PolylineOptions, shipxyMap.OverlayOptions);
    inherit(shipxyMap.Polygon, shipxyMap.Overlay);
    inherit(shipxyMap.PolygonOptions, shipxyMap.OverlayOptions);
    inherit(shipxyMap.LabelOptions, shipxyMap.OverlayOptions);

    /***定义事件类型常量***/
    var eventTypes = {
        //地图视图发生变化后事件
        MOVE_END: 'move_end',
        //地图缩放级别被改变后事件
        ZOOM_CHANGED: 'zoom_changed',
        //地图类型被改变后事件
        MAPTYPE_CHANGED: 'maptype_changed',
        //叠加物添加到地图上后事件
        OVERLAY_ADDED: 'overlay_added',
        //叠加物被删除后事件
        OVERLAY_REMOVED: 'overlay_removed',
        //地图叠加物的点击事件
        CLICK: 'click',
        //地图叠加物的双击事件
        DOUBLE_CLICK: 'doubleClick',
        //地图叠加物的鼠标按下事件
        MOUSE_DOWN: 'mouseDown',
        //地图叠加物的鼠标移动事件
        MOUSE_MOVE: 'mouseMove',
        //地图叠加物的鼠标抬起事件
        MOUSE_UP: 'mouseUp',
        //地图叠加物的鼠标移上事件
        MOUSE_OVER: 'mouseOver',
        //地图叠加物的鼠标移开事件
        MOUSE_OUT: 'mouseOut',
        //轨迹点的鼠标点击事件
        TRACKPOINT_CLICK: 'trackpoint_click',
        //轨迹点的鼠标移上事件
        TRACKPOINT_MOUSEOVER: 'trackpoint_mouseover',
        //轨迹点的鼠标移开事件
        TRACKPOINT_MOUSEOUT: 'trackpoint_mouseout'
    }

    for (var k in eventTypes) {
        shipxyMap.Event[k] = eventTypes[k];
    }

    //遍历对象，返回'属性:值'对象，函数除外
    function toObject(obj) {
        if (obj == null || !(obj instanceof Object)) {
            return null;
        }

        var o = {}, value;
        for (var key in obj) {
            value = obj[key];
            if (!(value instanceof Function)) {
                if (value instanceof Array) {
                    var ao = [], av;
                    for (var i = 0, len = value.length; i < len; i++) {
                        av = value[i];
                        if (av instanceof Object) {
                            ao[i] = toObject(av);
                        } else {
                            ao[i] = av;
                        }
                    }
                    o[key] = ao;
                } else if (value instanceof Object) {
                    o[key] = toObject(value);
                } else {
                    o[key] = value;
                }
            }
        }
        return o;
    }

    //继承原型，propertys：定义在子类原型上的新属性/方法集合
    function inherit(subClass, superClass, propertys) {
        function F() { };
        F.prototype = superClass.prototype;
        var prototype = new F();
        prototype.constructor = subClass;
        if (propertys) {
            for (var k in propertys) {
                if (propertys.hasOwnProperty(k))
                    prototype[k] = propertys[k];
            }
        }
        subClass.prototype = prototype;
    }

    //抛出异常
    function throwFlashError(method, errmsg) {
        var trace = isen ? ('method (' + method + ') error') : ('调用flash方法' + method + '出错，');
        if (!flash || !flash[method]) {
            trace += isen ? (method + ' is not found') : ('flash未初始化完成，未找到' + method + '方法');
        } else {
            trace += errmsg;
        }
        throw new Error(trace);
    }

    //获取Flash对象
    function getFlashObject(mapId, container, mapOptions) {
        var flashError; //Flash安装标志
        var ie = /MSIE/.test(navigator.userAgent); //是否IE浏览器
        if (ie) {
            try {
                new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
            } catch (e) { flashError = true; }
        }

        if (flashError) {
            container.innerHTML = isen ? 'uninstall flash' : "Flash未安装"; return;
        }

        var flashVars = [
            'mapId=' + mapId,
            'key=' + shipxyMap.key,
            'center=' + [mapOptions.center.lat, mapOptions.center.lng],
            'zoom=' + mapOptions.zoom,
            'mapType=' + mapOptions.mapType,
            'cmapType=' + mapOptions.cmapType,
            'mapTypes=' + mapOptions.mapTypes,
            'openStreetMap=' + (mapOptions.openStreetMap || 0),
            'lang=' + mapOptions.lang, //新增地图参数
            'bar=' + mapOptions.mapTypeBar, //新增地图bar参数
            'hw=' + mapOptions.hideBar, //新增海洋气象隐藏参数
            'hp=' + mapOptions.hidePort, //新增港口隐藏参数
            'language=' + mapOptions.language, //新增API语言版本

        ].join('&');

        var flashHtml = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" id="' + mapId + '" name="' + mapId + '"'
            + ' width="100%" height="100%" codebase="http://fpdownload.macromedia.com/get/flashplayer/current/swflash.cab">'
            + '<param name="quality" value="high" />'
            + '<param name="bgcolor" value="#869ca7" />'
            + '<param name="allowScriptAccess" value="always" />'
            + '<param name="allowFullScreen" value="true" />'
            + '<param name="wmode" value="transparent" />'
            + '<param name="SRC" value="' + flashPath + '" />'
            + '<param name="FlashVars" value="' + flashVars + '"/>'
            + '<embed src="' + flashPath + '" wmode="transparent" quality="high" bgcolor="#869ca7"'
            + ' width="100%" height="100%" id="' + mapId + '" name="' + mapId + '" align="middle" play="true" loop="false"'
            + ' allowscriptaccess="always"  allowFullScreen="true"  type="application/x-shockwave-flash" '
            + ' FlashVars="' + flashVars + '"></embed></object>';
        container.innerHTML = flashHtml;
        return ie ? container.childNodes[0] : container.getElementsByTagName("embed")[0];
    }

    //获取Flash版本
    function getFlashVer() {
        var f = "";
        var n = navigator;
        if (n.plugins && n.plugins.length) {
            for (var i = 0; i < n.plugins.length; i++) {
                if (n.plugins[i].name.indexOf("Shockwave Flash") != -1) {
                    f = n.plugins[i].description.split("Shockwave Flash")[1].split(' ')[1];
                    break;
                }
            }
        } else if (window.ActiveXObject) {
            for (var j = 10; j >= 2; j--) {
                try {
                    var f1 = eval("new ActiveXObject('ShockwaveFlash.ShockwaveFlash." + j + "');");
                    if (f1) {
                        f = j + '.0';
                        break;
                    }
                } catch (e) { }
            }
        }
        return f;
    }
})();

//动态接受flash内部图形id、坐标并更新
function showGraphInfo(graphicId, graphicPoint) {
    var overlay = map.getOverlayById(graphicId);
    if (!overlay) return;
    overlay.data.length = 0;
    var latLngFormat = shipxyMap.LatLng;
    if (overlay.type == "marker") {
        overlay.data = latLngFormat(graphicPoint[0].lat, graphicPoint[0].lng);
    } else if (overlay.type == "polyline") {
        for (var i = 0; i < graphicPoint.length; i++) {
            overlay.data.push(latLngFormat(graphicPoint[i].lat, graphicPoint[i].lng));
        }
    } else if (overlay.type == "polygon") {
        for (var i = 0; i < graphicPoint.length; i++) {
            overlay.data.push(latLngFormat(graphicPoint[i].lat, graphicPoint[i].lng));
        }
    }
}