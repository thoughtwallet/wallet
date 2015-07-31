/*
  Bitcoin UI controllers for addresses and keys
*/
var UIB = {};
UIB.addrHRef = 'https://blockchain.info/address/';
UIB.addrHRefTestnet = 'https://tbtc.blockr.io/address/info/';
UIB.addrClass = null;//'bitaddr';//'UIB_addr';
UIB.addrShowClass = 'addrshow';
UIB.addrNameClass = 'addrnameshow';
UIB.addrClassSmall = 'bitaddrsmall';//'UIB_addrsmall';
UIB.pubClass = 'pubkey';//'UIB_pub';
UIB.pubClassSmall = 'pubkeysmall';//'UIB_pub';

UIB.setAddrTags = function( addr, t ) {
  addr.setMetaData( {tags:t?t:{}} );
}

/*Bitcoin.Address._toString = Bitcoin.Address.toString;
Bitcoin.Address.toString = function() {
  if (this.hash.version == 0x6F)
    return;
  return new Bitcoin.Address( hash );
}*/

UIB.addrToStr = function( addr ) {
  return UIH.getelchk('_testnet') ? 
               Bitcoin.ImpExp.Sync.fmtAddr(addr,true) : addr.toString();
}
UIB.addrFromStr = function( string ) {
  var bytes = Bitcoin.Base58.decode(string);
  var hash = bytes.slice(0, 21);
  var checksum = Crypto.SHA256(Crypto.SHA256(hash, {asBytes: true}), {asBytes: true});
  if (checksum[0] != bytes[21] ||
      checksum[1] != bytes[22] ||
      checksum[2] != bytes[23] ||
      checksum[3] != bytes[24]) 
    return;
  var version = hash.shift();
  if (version != 0 && version != 0x6F)
    return;
  return new Bitcoin.Address( hash );
}

UIB.createAddr = function( addrOrAddrStr, t ) {
  if (!t && addrOrAddrStr instanceof Bitcoin.Address)
    t = UIH.copyData( UIB.getAddrMetaData(addrOrAddrStr).tags );
  else
    addrOrAddrStr = UIB.addrFromStr( addrOrAddrStr );
  return Bitcoin.Address.create( addrOrAddrStr, {tags:t?t:{}} );
}

UIB.getAddrMetaData = function( addr ) {
  var md = addr.getMetaData();
  if (!md)
    UIB.setAddrTags( addr, {} );
  return addr.getMetaData();
}

UIB.getAddrTags = function( addr ) {
  return UIB.getAddrMetaData(addr).tags;
}

UIB.testHex = function( hex, maxlen ) {
  if (hex) {
    var h2 = hex.replace( /[^a-f0-9+\/]/ig, "" );
    if (hex != h2 || (maxlen && hex.length > maxlen))
      return null;
  }
  return hex;
}

UIB.pubToAddr = function( pub, t ) {
  var a = null;
  if (UIB.testHex( pub, 130 ))
    a = Bitcoin.Address.fromPubKey( pub );
  if (a)
    UIB.setAddrTags( a, t?t:{pubkey:UIH.copyData(pub)} );
  return a;
}

UIB.getCacheAddr = function( addr ) {
  if (!UIB.addrCache.global)
    return null;
  var arr = UIB.addrCache.global.arr;
  var i = UIH.indexOf( arr, addr );
  return i>=0 ? arr[i] : null;
}

UIB.lookupAddr = function( addr ) {
  if (!UIB.addrCache.global)
    return addr;
  var arr = UIB.addrCache.global.arr;
  var i = UIH.indexOf( arr, addr );
  return i>=0 ? arr[i] : addr;
}

UIB.importAddrTags = function( arr, arr2 ) {
  for( var i=0,j,yes=0; i<arr.length; i++ ) {
    j = UIH.indexOf( arr2, arr[i] );
    if (j >= 0)
      yes++,
      arr[i].getMetaData().tags = 
                      UIH.copyData( arr2[j].getMetaData().tags );
  }
  return yes;
}

UIB.filterAddrs = function( arr, tag, eq, exist ) {
  var res = [];
  for( var i=0; i<arr.length; i++ )
    if (arr[i].getMetaData().tags[tag])
      if (exist || arr[i].getMetaData().tags[tag] == eq)
        res.push( arr[i] );
  return res;
}

UIB.getAddrsWithPubs = function( addrs ) {
  return UIB.filterAddrs( addrs, 'pubkey', '', true );
}

UIB.addAddr = function( addrs, a ) {
  return a;
}

UIB.getAddr = function( id, statid ) {
  var addr = UIB.createAddr( UIH.getel(id) );
  if (!addr)
    UIH.errstat( statid, "Valid bitcoin address needed" );
  return addr ? addr : "";
}

UIB.getPrivOrPass = function( id, statid ) {
  var priv = UIH.getel( id );
  if (!priv)
    return UIH.errstat( statid, "Private key/passphrase needed" );
  if (priv.length < 20)
    return UIH.errstat( statid, "20 or more chars expected" );
  var keyinfo = Bitcoin.Address.fromPrivOrPass( priv );
  if (!keyinfo)
    return UIH.errstat( statid, "Invalid private key/passphrase" );
  keyinfo.a.setMetaData( {tags:{}} );
  return keyinfo;
}

UIB.getPubKeyAddr = function( id, statid, noerr, errsfx ) {
  errsfx = errsfx ? errsfx : "";
  var pub = UIH.getel( id );
  if (!pub)
    if (!noerr)
      return UIH.errstat( statid, "Public key needed"+errsfx );
    else
      return "";
  if (pub.length != 130)
    if (!noerr)
      return UIH.errstat( statid, "130 chars expected"+errsfx );
    else
      return "";
  if (!UIB.testHex( pub, 130 ))
    if (!noerr)
      return UIH.errstat( statid, "Hex code expected"+errsfx );
    else
      return "";
  var a = Bitcoin.Address.fromPubKey( pub );
  if (a)
    UIB.setAddrTags( a, {pubkey:pub} );
  else
    if (!noerr)
      return UIH.errstat( statid, "Invalid public key"+errsfx );
  return a ? a : "";
}

UIB.fmtAddr = function( addr, cls, tag, maxlen, nolink, keyhint ) {
  maxlen = maxlen<0 ? 0 : (!maxlen ? 30 : maxlen);
  var showlink = !nolink;
  if (!addr)
    return "&nbsp;";
  var addrMatch = UIB.getCacheAddr( addr );
  var name = "", fullname = "", haskey = false;
  if (addrMatch)
    name = UIB.getAddrMetaData(addrMatch).tags.name ? 
                      UIB.getAddrMetaData(addrMatch).tags.name : "",
    fullname = UIB.getAddrMetaData(addrMatch).tags.comment ? 
                      UIB.getAddrMetaData(addrMatch).tags.comment : "";
  if (addr instanceof Bitcoin.Address)
    haskey = UIB.getAddrMetaData(addr).keyinfo ? true : false;
  addr = addr.toString();
  if (UIH.getelchk( '_testnet' ))
    addr = Bitcoin.ImpExp.Sync.fmtAddr( addr, true );
  if (maxlen && name.length > 10)
    name = name.substr(0,10) + "... ";
  else
    if (name.length > 20)
      name = name.substr(0,20) + "... ";
    else
      name += " ";
  var href = UIB.addrHRef + addr;
  if (UIH.getelchk( '_testnet' ))
    href = UIB.addrHRefTestnet + addr;
  else
    if (addr[0] != '1')
      showlink = false;
  maxlen = maxlen ? maxlen : (addr+name).length+1000;
  if (name.length >= maxlen)
    name = name.substr(0,maxlen)+"...", addr = "";
  else
    if ((name+addr).length > maxlen)
      addr = addr.substr(0,maxlen-(name.length-3)) + "...";
  if (fullname)
    name = "<span class='" + UIB.addrNameClass + 
                   "' title='" + fullname + "'>" + name + "</span>";
  else
    if (name)
      name = "<span class='" + UIB.addrNameClass + "'>" + name + "</span>";
  if (showlink && addr)
    addr = "<a href='" + href + "' target=_blank>" + addr + "</a>";
  else
    addr = "<span class='" + UIB.addrShowClass + "'>" + addr + "</span>";
  if (haskey && keyhint)
    addr = "<span class='haskey' title='has key'>*</span>" + addr;
  return UIH.fmt( name+addr, cls, tag );
}

UIB.getQRimg = function( addr ) {
  addr = addr.toString();
  var qrCode = qrcode( 3, 'M' );
  addr = addr.replace( /^[\s\u3000]+|[\s\u3000]+$/g, '' );
  qrCode.addData( addr );
  qrCode.make();
  var tag = qrCode.createImgTag( 4 );
  return "<div class='qrcode'>" + tag + "</div>";
}

UIB.prevShowAddr = "";
UIB.setAddr = function( id, addr, QRid, cls, tag, maxlen ) {
  addr = addr ? addr : "";
  if (UIH.getelobj(id) instanceof HTMLInputElement)
    return UIH.setel( id, UIB.addrToStr(addr) );
  UIH.setel( id, UIB.fmtAddr(addr,cls?cls:UIB.addrClass,tag,maxlen) );
  if (QRid && UIH.getelobj(QRid) && UIB.prevShowAddr != addr.toString())
    if (addr)
      UIH.setel( QRid, UIB.getQRimg(addr) );
    else
      UIH.setel( QRid, "" );
  UIB.prevShowAddr == addr.toString();
}

UIB.fmtAddrSmall = function( addr, tag, maxlen, showlink, keyhint ) {
  return UIB.fmtAddr( addr, UIB.addrClassSmall, tag, 
                      maxlen, showlink, keyhint );
}

UIB.showAddrInfo2 = function( ids, addr, showpriv ) {
  var nullKI = {addr:"",a:addr,pub:""};
  var tags = addr ? UIB.getAddrMetaData(addr).tags : {pubkey:""};
  var keyinfo = addr ? UIB.getAddrMetaData(addr).keyinfo : nullKI;
  keyinfo = keyinfo ? keyinfo : nullKI;
  addr = addr ? addr : keyinfo.a;
  if (!keyinfo.h160hex)
    keyinfo.h160hex = addr ? Crypto.util.bytesToHex(addr.hash) : "";
  UIB.setAddr( ids.info_addr, addr, ids.info_qr, null, null, -1 );
  //UIB.setAddr( ids.info_addrtestnet, addr?Bitcoin.ImpExp.Sync.fmtAddr(addr,true):"", 
    //           null, null, null, -1 );
  UIH.setel( ids.info_pub, keyinfo.pub ? keyinfo.pub : tags.pubkey );
  UIH.setel( ids.info_hash160, keyinfo.h160hex );
  if (showpriv && keyinfo.priv) {
    UIH.setel( ids.info_key, keyinfo.priv );
    UIH.setel( ids.info_pass, keyinfo.pass ? 
      ("<span class='small'>Passphrase: </span>" + 
       "<span class='medsz privinfo'>" + keyinfo.pass + "</span>")
      : "" );
  }
  else
    UIH.clrel( ids.info_pass ),
    UIH.setel( ids.info_key, keyinfo.priv ? 
                  (keyinfo.priv.substr(0,7)+"...") : 
                  (showpriv?(addr?"[not provided]":""):"") );
}

UIB.importAddrs = function( arr, arr2 ) {
  var rejected = 0;
  for( var i=0,tags,ab; i<arr2.length; i++ ) {
    if (typeof arr2[i] == 'string')
      tags = {address:arr2[i]};
    else
      if (arr2[i] instanceof Bitcoin.Address)
        tags = UIH.copyData( UIB.getAddrMetaData(arr2[i]).tags ),
        tags.address = arr2[i].toString();
      else
        tags = arr2[i];
    var nt = {};
    for( var t in tags )
      if (tags[t])
        nt[t.toLowerCase()] = tags[t];
    if (nt.pubkey)
      ab = UIB.pubToAddr( nt.pubkey, nt );
    else
      ab = UIB.createAddr( nt.address, nt );
    if (ab && !UIH.isIn( arr, ab ))
      arr.push( ab );
    else
      rejected++;
  }
  return rejected;
}

UIB.exportAddrs = function( arr ) {
  var xa = [];
  for( var i=0,md; i<arr.length; i++ ) {
    md = UIH.copyData( UIB.getAddrMetaData(arr[i]).tags );
    md.address = arr[i].toString();
    xa.push( md );
  }
  return xa;
}


//----key generator controller----

UIB.gen = {};
UIB.gen.ids = { //default ids
  addr:'gen_addr',
  pass:'gen_pass',
  privofpass:'gen_privofpass',
  pub:'gen_pub',
  qr:'gen_qr',
  stat:'gen_stat',
  editchg:['gen_pass'],
  gen:'gen_gen',
  rand:'gen_rand',
  accept:'gen_ok',
  mine:'gen_mine',
  minematch:'gen_minematch',
  minematch2:'gen_minematch2',
  minematch3:'gen_minematch3',
  clkverify:['gen_ok','gen_gen','gen_rand','gen_mine']
}
UIB.genController = function( ) {}
UIB.genController.prototype = new UIH.Controller();
UIB.genController.prototype.init = function( ids ) {
  this.controller_init( ids ? ids : UIB.gen.ids );
  this.privChanged = true;
  this.keyinfo = null;
  this.show( this.keyinfo );
}
UIB.gen.createController = function( ids ) {
  var c = new UIB.genController();
  c.init( ids );
  return c;
}
UIB.genController.prototype.onOtherDataChg = function( other ) {
  if (other instanceof UIB.addrCacheController)
    this.refresh();
}
UIB.genController.prototype.getAddr = function() {
  return this.keyinfo ? this.keyinfo.a : "";
}
UIB.genController.prototype.getKey = function() {
  return this.keyinfo;
}
UIB.genController.prototype.show = function( keyinfo ) {
  if (keyinfo) {
    UIH.setel( this.ids.pass, keyinfo.pass?keyinfo.pass:keyinfo.priv );
    UIB.setAddr( this.ids.addr, keyinfo.a, this.ids.qr, null, null, -1 );
    UIH.setel( this.ids.privofpass, keyinfo.pass?keyinfo.priv:"" );
    UIH.setel( this.ids.pub, "public key: " + keyinfo.pub );
  }
  else
    UIH.clrel( this.ids.stat ),
    UIH.clrel( this.ids.pass ),
    UIH.clrel( this.ids.addr ),
    UIH.clrel( this.ids.pub ),
    UIH.clrel( this.ids.privofpass );
}
UIB.genController.prototype.refresh = function( ) {
  this.show( this.keyinfo );
}
UIB.genController.prototype.onEditChg = function( id ) {
  if (id == this.ids.pass)
    this.privChanged = true;
}
UIB.genController.prototype.setKey = function( keyinfo, msg ) {
  this.show( keyinfo );
  UIH.setstat( this.ids.stat, msg );
  if (keyinfo)
    this.keyinfo = keyinfo,
    UIB.setAddrTags( this.keyinfo.a, {} );
  this.privChanged = false;
}
UIB.genController.prototype.go = function( ) {
  var priv = UIH.getel( this.ids.pass );
  if (this.rand) // || !this.privChanged)
    priv = "";
  var keyinfo = Bitcoin.Address.fromPrivOrPass( priv, key_to_english );
  if (!keyinfo)
    return UIH.errstat( this.ids.stat, "Passphrase invalid" );
  this.setKey( keyinfo, "" );
  if (this.callbackid)
    UIH.getelobj(this.callbackid).click();
  UIH.endProcess( this.ids.stat, "" );
}
UIB.gen.genit = function( ) {
  UIB.gen.w.go( );
}
UIB.genController.prototype.gen = function( rand, cbid ) {
  if (!rand) {
    if (!UIH.getel(this.ids.pass))
        return UIH.errstat( this.ids.stat, 
                            "Passphrase or key needed" );
    else
      if (UIH.getel(this.ids.pass).length < 20)
          return UIH.errstat( this.ids.stat, 
                              "20 or more chars expected" );
  }
  this.rand = rand;
  UIB.gen.w = this;
  this.callbackid = cbid;
  UIH.doProcess( this.ids.stat, "Calculating...", 'UIB.gen.genit();' );
}
UIB.genController.prototype.mine = function( ) {
  function testsub( id, statid ) {
    if (UIH.getel(id) &&  // /^[1-9A-HJ-NP-Za-km-z]+$/
        UIH.getel(id).replace( Bitcoin.Base58.validRegex, '' ))
      return UIH.errstat( statid, "Invalid chars in substring" );
    return true;
  }
  if (UIH.getelchk( '_testnet' ))
    return UIH.errstat( this.ids.stat, "Testnet address mining not supported" );
  if (!UIH.getel( this.ids.minematch ))
    return UIH.errstat( this.ids.stat, "Substring needed" );
  if (!testsub( this.ids.minematch, this.ids.stat ) || 
      !testsub( this.ids.minematch2, this.ids.stat ) ||
      !testsub( this.ids.minematch3, this.ids.stat ))
    return false;
  this.cancelled = false;
  this.mining = true;
  var This = this;
  UIH.setel( this.ids.mine, "Cancel" );
  function cb( msg, i, keyinfo ) {
    if (This.cancelled)
      return true;
    if (keyinfo)
      This.setKey( keyinfo, "Calculating ("+(i+1)+")..." );
    if (msg == "complete")
      This.minedone();
  }
  Bitcoin.Address.mine( 
              [UIH.getel(this.ids.minematch),
               UIH.getel(this.ids.minematch2),
               UIH.getel(this.ids.minematch3)], 
              cb, key_to_english );
}
UIB.genController.prototype.minedone = function( ) {
  this.cancelled = true;
  this.mining = false;
  UIH.setel( this.ids.mine, "Mine" );
  UIH.clrel( this.ids.stat );
}
UIB.genController.prototype.verify = function( id ) {
  if (this.mining)
    this.minedone();
  else
    if (id == this.ids.mine) this.mine();
  if (id == this.ids.gen) this.gen();
  if (id == this.ids.rand) this.gen(true);
  if (id == this.ids.accept) {
    if (this.privChanged || !this.getKey()) {
      this.gen( false, id );
      return false;
    }
    this.broadcastChg( 'ok' );
    return this.getKey();
  }
  return false;
}


//----address selection list controller----

UIB.selAddrList = {};
UIB.selAddrList.coldefs = [ 
  {class:'addrselcell',act:true,name:'addr'}
];
UIB.selAddrList.ids = { //default ids
  list:'sal_list',
  stat:'sal_stat',
  info_addr:'ali_addr',
  info_addrtestnet:'ali_addrtestnet',
  info_pub:'ali_pub',
  info_hash160:'ali_hash160',
  info_pass:'ali_pass',
  info_key:'ali_key',
  info_qr:'ali_qr',
  info_showpriv:'ali_showpriv',
  details:'sal_details',
  info_details:'ali_details',
  clkverify:['ali_showpriv','sal_details']
}
UIB.selAddrListController = function( ) {
  // overrides
  this.refresh = this.sal_refresh;
  this.onColHov = this.sal_onColHov;
  this.getColVal = this.sal_getColVal;
  this.set = this.sal_set;
  this.verify = this.sal_verify;
  this.onDel = this.sal_onDel;
}
UIB.selAddrListController.prototype = new UIH.ListController();
UIB.selAddrListController.prototype.sal_init = function( ids, coldefs ) {
  this.list_init( ids?ids:UIB.selAddrList.ids, 
                  coldefs?coldefs:UIB.selAddrList.coldefs );
  this.maxWid = 25;
  this.controllers = {};
  UIH.enel( this.ids.details, false );
  UIH.chkel( this.ids.info_showpriv );
  UIH.chkel( this.ids.details );
}
UIB.selAddrList.createController = function( ids, coldefs ) {
  var c = new UIB.selAddrListController();
  c.sal_init( ids, coldefs );
  return c;
}
UIB.selAddrListController.prototype.onOtherDataChg = function( other ) {
  if (other instanceof UIB.addrCacheController)
    this.refresh();
}
UIB.selAddrListController.prototype.sal_refresh = function( ) {
  UIH.visel( this.ids.info_details, 
             UIH.getelchk(this.ids.details) && this.arr.length>0 );
  UIH.enel( this.ids.details, this.arr.length>0 );
  this.showInfo( this.inforow?this.inforow:0 );
  return this.list_refresh();
}
UIB.selAddrListController.prototype.showInfo = function( i ) {
  this.inforow = i >= this.arr.length ? -1 : i;
  UIB.showAddrInfo2( this.ids, i>=0?this.arr[i]:null,
                     UIH.getelchk(this.ids.info_showpriv) );
}
UIB.selAddrListController.prototype.sal_verify = function( id ) {
  if (id == this.ids.details)
    this.refresh();
  if (id == this.ids.info_showpriv || id == this.ids.details)
    this.showInfo( this.inforow );
  return true;
}
UIB.selAddrListController.prototype.getAddrs = function( ) {
  return this.arr;
}
UIB.selAddrListController.prototype.getKeys = function( verify ) {
  var keys = [];
  for( var i=0, ki; i<this.arr.length; i++ ) {
    ki = UIB.getAddrMetaData(this.arr[i]).keyinfo;
    if (verify && !ki)
      return null;
    keys[i] = ki;
  }
  return keys.length ? keys : null;
}
UIB.selAddrListController.prototype.sal_onColHov = function( 
                                                      i, col, addr ) {
  this.showInfo( i );
  return false;
}
UIB.selAddrListController.prototype.sal_getColVal = function( 
                                              row, col, coldef, addr ) {
  if (coldef.name == 'addr')
    return UIB.fmtAddrSmall( addr, "", 
                  UIH.getelchk(this.ids.details) ? -1 : this.maxWid, 
                  !this.showlinks, this.keyHint );
  return this.list_getColVal( row, col, coldef, addr );
}
UIB.selAddrListController.prototype.sal_set = function( id, addr ) {
  UIB.setAddr( id, addr );
}
UIB.selAddrListController.prototype.sal_onDel = function( i ) {
  this.inforow = this.arr.length-2;
  return true;
}


//----address list w add&del controller----

UIB.addrList = {};
UIB.addrList.coldefs = [
  {class:'delcell',act:true,clkdel:true},
  {class:'addrcell',act:true,name:'addr'}
];
UIB.addrList.ids = { //default ids
  addfrom:'al_addr',
  addclk:'al_addrok',
  addfrompub:'al_pub',
  addpubclk:'al_pubok',
  addprivfrom:'al_priv',
  list:'al_list',
  addradd:'al_addrok',
  details:'al_details',
  clkverify:['al_addrok','ali_showpriv','al_details'],
  stat:'al_stat',

  info_details:'ali_details',
  info_addr:'ali_addr',
  info_addrtestnet:'ali_addrtestnet',
  info_pub:'ali_pub',
  info_hash160:'ali_hash160',
  info_pass:'ali_pass',
  info_key:'ali_key',
  info_qr:'ali_qr',
  info_showpriv:'ali_showpriv'
}
UIB.addrListController = function( ) {
  this.verify = this.al_verify;
}
UIB.addrListController.prototype = new UIB.selAddrListController();
UIB.addrListController.prototype.al_init = function( ids, coldefs ) {
  this.sal_init( ids?ids:UIB.addrList.ids, 
                 coldefs?coldefs:UIB.addrList.coldefs );
  this.showlinks = true;
}
UIB.addrList.createController = function( ids, coldefs ) {
  var c = new UIB.addrListController();
  c.al_init( ids, coldefs );
  return c;
}
UIB.addrListController.prototype.addAddr = function( a ) {
  a = UIB.createAddr( a );
  var i = UIH.indexOf( this.arr, a );
  if (i >= 0) {
    if (!UIB.getAddrMetaData(a).keyinfo)
      UIB.getAddrMetaData(a).keyinfo = 
                              UIB.getAddrMetaData(this.arr[i]).keyinfo;
    this.arr[i] = a;
    this.inforow = i;
    this.dataChanged();
  }
  else {
    this.inforow = this.arr.length;
    this.list_add( a );
  }
  return a;
}
UIB.addrListController.prototype.verifyAddrOrPub = function( fromid ) {
  if (!fromid)
    fromid = this.ids.addfrom;
  var a, pub=UIH.getel( this.ids.addfrompub );
  if (fromid == this.ids.addfrompub)
    a = UIB.getPubKeyAddr( this.ids.addfrompub, this.ids.stat );
  else {
    a = UIB.getAddr( fromid, this.ids.stat );
    if (pub) { 
      var a2s = Bitcoin.Address.fromPubKey(pub).toString();
      var as = a.toString();
      if (a2s != as)
        pub = "";
    }
  }
  if (a) {
    var tags = {};
    if (pub) tags.pubkey = pub;
    if (UIH.getel(this.ids.name)) tags.name = UIH.getel(this.ids.name);
    if (UIH.getel(this.ids.comment))
      tags.comment = UIH.getel( this.ids.comment );
    if (UIH.getelobj(this.ids.type))
      if (UIH.getelobj(this.ids.type).checked)
        tags.type = "wallet";
    UIB.setAddrTags( a, tags );
  }
  return a;
}
UIB.addrListController.prototype.add = function( fromid ) {
  var a = this.verifyAddrOrPub( fromid );
  if (a)
    this.addAddr( a );
  return a;
}
UIB.addrListController.prototype.addKey = function( keyinfo ) {
  if (!keyinfo)
    return -1;
  var i = UIH.indexOf( this.arr, keyinfo.addr );
  if (i < 0)
    this.addAddr( keyinfo.a ),
    i = UIH.indexOf( this.arr, keyinfo.addr );
  else
    this.postRefresh();
  if (i >= 0)
    UIB.getAddrMetaData(this.arr[i]).keyinfo = keyinfo, 
    this.hovrow = i, this.onColHov( i );
  return i;
}
UIB.addrListController.prototype.al_verify = function( id ) {
  if (id == this.ids.addclk)
    return this.add();
  if (id == this.ids.addpubclk)
    return this.add( this.ids.addfrompub );
  return this.sal_verify( id );
}


//----address cache controller----

UIB.addrCache = {};
UIB.addrCache.defaultAddrs = [
      {"name":"Alice",
       //"address":"14Dbmkg9mgXxQNoPLpWmG3xaz4nWR6hqEM",
       "comment":"Demo public key address",
       "pubkey":"04f49a2b697137978bb31d8059d94dce7e713c2e0238"+
                "05d18eb01f7e2f469747642e90ff2a3817ed9165392d"+
                "7ebe879ea5e508ffd19d9dee98956ca5f35a587fa5"},
      {"name":"Bob",
       "comment":"Demo public key address",
       "pubkey":"048b16e4f6b65fd2e0597655ec09092e293a306e868dce1"+
                "9077fef8bc25b0fb05117053d4d9421f154ce1c71a96109"+
                "f2b7caac86d17cd8618da0390c9f8d966070"},
      {"name":"Mary",
       "comment":"Demo public key address",
       "pubkey":"0486e243a79f07965eca1da5d97b17470cda59623c4"+
                "dc545263556db011d8d2eac2ce84e92414536900d60"+
                "d2dfc793b61ad75aca19103342bc124d8521daa93e83"},
      {"name":"Demo1",
       "comment":"Demo wallet address",
       "type":"wallet",
       "address":"16hKnJhyhi7dn76s7eHoWmWhmmxnB2kVpz"},
      {"name":"Demo2",
       "comment":"Demo wallet address",
       "type":"wallet",
       "address":"1Ht6SdKEN3PFxXxbbbb4zpCXZuYJJ768yT"}
];
UIB.addrCache.ids = { //default ids
  name:'ac_name',
  comment:'ac_comment',
  type:'ac_type',
  addfrom:'ac_addr',
  addclk:'ac_addrok',
  addfrompub:'ac_pub',
  addpubclk:'ac_pubok',
  list:'ac_list',
  addradd:'ac_addrok',
  details:'ac_details',
  clkverify:['ac_addrok','ac_pubok'],
  stat:'ac_stat',

  clear:'ac_clear',
  export:'ac_export',
  exportsave:'ac_exportsave',
  exporteddata:'ac_exportedlist',
  loadfile:'ac_loadfile',
  loadtext:'ac_loadtext',
  text:'ac_text',
  file:'ac_file'
}
UIB.addrCache.global = null;
UIB.addrCacheController = function( ) {}
UIB.addrCacheController.prototype = new UIB.addrListController();
UIB.addrCacheController.prototype.ac_init = function( ids, coldefs ) {
  this.al_init( ids?ids:UIB.addrCache.ids, 
                coldefs?coldefs:UIB.addrList.coldefs );
  this.showLinks = true;
  this.maxWid = 35;
  UIB.addrCache.global = this;
}
UIB.addrCache.createController = function( ids, coldefs ) {
  var c = new UIB.addrCacheController();
  c.ac_init( ids, coldefs );
  return c;
}
UIB.addrCacheController.prototype.verify = function( id ) {
  var a;
  if (id == this.ids.addpubclk) {
    a = UIB.getPubKeyAddr( this.ids.addfrompub, this.ids.stat );
    if (a)
      UIB.setAddr( this.ids.addfrom, a ), UIH.clrel( this.ids.stat );
  }
  else
    a = this.al_verify( id );
  return a;
}
UIB.addrCacheController.prototype.onDelOk = function( i ) {
  //this.refreshAll();
}
UIB.addrCacheController.prototype.loadDefaults = function() {
  var t = UIH.getel( this.ids.text );
  if (!t) {
    t = JSON.stringify( UIB.addrCache.defaultAddrs, null, 2 );
    UIH.setel( this.ids.text, t );
  }
  this.processLoadedData( t, 0, false );
  this.dataChanged();
  //this.refreshAll();
}
UIB.addrCacheController.prototype.setup = function( a ) {
  UIB.setAddr( this.ids.addfrom, a );
  UIH.setel( this.ids.name, UIB.getAddrTags(a).name );
  UIH.setel( this.ids.comment, UIB.getAddrTags(a).comment );
  UIH.setel( this.ids.addfrompub, UIB.getAddrTags(a).pubkey );
  UIH.chkel( this.ids.type, UIB.getAddrTags(a).type=='wallet' );
}
UIB.addrCacheController.prototype.onSel = function( i ) {
  this.setup( this.arr[i] );
}
UIB.addrCacheController.prototype.exportData = function() {
  var text = JSON.stringify( UIB.exportAddrs(this.arr), null, 2 );
  UIH.setel( this.ids.exporteddata, text );
  UIH.getelobj(this.ids.exportsave).style.display = "inline-block",
  UIH.getelobj(this.ids.exportsave).href = 
                        'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
}
UIB.addrCacheController.prototype.processLoadedData = function( 
                                              data, i, validate ) {
  var ret = {};
  try {
    ret.arr = JSON.parse( data );
    if (!ret.arr.length)
      ret.nodata = true;
    else
      if (!validate)
        this.load.rejected += UIB.importAddrs( this.arr, ret.arr );
  }
  catch( e ) {ret.invalid=true;}
  return ret;
}
UIB.addrCacheController.prototype.loadEnd = function( ) {
  //this.refreshAll();
}
UIB.addrCacheController.prototype.loadStart = function( 
                                          from, validate ) {
  this.load.rejected = 0;
  return true;
}


//----address option (enter or sel from cache) controller----

UIB.addrOptList = {};
UIB.addrOptList.coldefs = [
  {class:'addrselcell',act:true,name:'addr'}
];
UIB.addrOptList.ids = { //default ids
  addclk:'aol_ok',
  addfrom:'aol_addr',
  name:'aol_name',
  list:'aol_list',
  addradd:'aol_ok',
  clkverify:['aol_ok'],
  stat:'aol_stat'
}
UIB.addrOptListController = function( ) {
  this.verify = this.aol_verify;
}
UIB.addrOptListController.prototype = new UIB.addrListController();
UIB.addrOptListController.prototype.aol_init = function( ids, coldefs ) {
  this.al_init( ids?ids:UIB.addrOptList.ids,
                coldefs?coldefs:UIB.addrOptList.coldefs );
  this.showlinks = false;
  this.maxWid = 30;
}
UIB.addrOptList.createController = function( ids, coldefs ) {
  var c = new UIB.addrOptListController();
  c.aol_init( ids, coldefs );
  return c;
}
UIB.addrOptListController.prototype.onOtherDataChg = function( other ) {
  if (other instanceof UIB.addrCacheController)
    this.arr = other.arr, this.refresh();
}
UIB.addrOptListController.prototype.get = function( ) {
  return this.a;
}
UIB.addrOptListController.prototype.aol_verify = function( id ) {
  if (id == this.ids.addclk || id == this.ids.addpubclk) {
    this.a = this.verifyAddrOrPub( id==this.ids.addpubclk ? 
                                   this.ids.addfrompub : 
                                   this.ids.addfrom );
    this.sets( this.ids.settosel, this.get() );
    if (this.a)
      this.broadcastChg( 'ok' ),
      UIH.clrel( this.ids.stat );
    return this.a;
  }
  return this.al_verify( id );
}
UIB.addrOptListController.prototype.onSel = function( i ) {
  this.a = this.arr[i];
  this.broadcastChg( 'ok' );
}
UIB.addrOptListController.prototype.getAddr = function( ) {
  return this.a;
}
UIB.addrOptListController.prototype.setup = function( addr ) {
  UIB.setAddr( this.ids.addfrom, addr );
  this.a = addr;
  UIH.clrel( this.ids.stat );
  this.sets( this.ids.settosel, addr );
}


//----pub key option (enter or select from cache) controller----

UIB.pubKey = {};
UIB.pubKey.ids = { //default ids
  //settosel:['pk_addr'],
  pubsel:'pk_pubsel',
  pub:'pk_pub',
  addfrompub:'pk_pub',
  addpubclk:'pk_ok',
  list:'pk_list',
  clkverify:['pk_ok'],
  stat:'pk_stat'
}
UIB.pubKeyController = function( ) {}
UIB.pubKeyController.prototype = new UIB.addrOptListController();
UIB.pubKeyController.prototype.pk_init = function( ids, coldefs ) {
  this.aol_init( ids?ids:UIB.pubKey.ids, coldefs );
}
UIB.pubKey.createController = function( ids, coldefs ) {
  var c = new UIB.pubKeyController();
  c.pk_init( ids, coldefs );
  return c;
}
UIB.pubKeyController.prototype.onOtherDataChg = function( other ) {
  if (other instanceof UIB.addrCacheController)
    this.arr = UIB.getAddrsWithPubs( other.arr ),
    this.refresh();
}
UIB.pubKeyController.prototype.getPubAddr = function( ) {
  return this.getAddr();
}
UIB.pubKeyController.prototype.setup = function( pubkey ) {
  /*UIH.clrel( this.ids.stat );
  UIB.setAddr( this.ids.addr, UIB.getPubKeyAddr(pubkey) );
  UIB.setel( this.ids.pub, pubkey );*/
}

