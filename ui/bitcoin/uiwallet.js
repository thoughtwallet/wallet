/*
  Bitcoin wallet UI controllers
*/
UIB.__TEST__ = false;
UIB.MAXN = 3;
UIB.txHRef = 'https://blockchain.info/tx/';
UIB.addrHRefLoad = 'http://blockexplorer.com/q/mytransactions/';
UIB.txClass = 'bitaddrsmall';//'UIB_txhash';
UIB.txClassSmall = 'bitaddrsmall';//'UIB_txhash';

UIB.fmtTxHash = function( h, hs, cls, tag, timestamp ) {
  if (!h)
    return "";
  var href = UIB.txHRef + h;
  if (!hs) hs = h;
  var timestr = timestamp ? UIB.fmtTxTime(timestamp)+" " : "";
  var a = timestr + "<a href='" + href + "' " + 
          "target=_blank>" + hs + "</a>" +
          (timestr?"":"");
  return UIH.fmt( a, cls?cls:UIB.txClass, tag );
}

UIB.fmtTxTime = function( timestamp ) {
  var tf = "";
  if (timestamp)
    timestamp = timestamp.split( ":" ),
    tf = timestamp[0] + ":" + timestamp[1];
  return tf;
}

UIB.fmtTxHash2 = function( txhash, maxlen, timestamp, cls ) {
  var h = "";
  if (txhash)
    h = Bitcoin.ImpExp.BBE.exportHash( txhash );
  var timestr = timestamp ? " " + UIB.fmtTxTime(timestamp) : "";
  maxlen -= timestr.length;
  maxlen = maxlen>0 ? maxlen : 1;
  var hs = maxlen ? h.substr(0,maxlen)+"..." : h;
  return UIB.fmtTxHash( h, hs, cls, null, timestamp );
}

UIB.setTxHash = function( id, txhash, maxlen, timestamp ) {
  UIH.setel( id, UIB.fmtTxHash2(txhash,maxlen,timestamp) );
}

UIB.fmtTxHashSmall = function( h, hs, tag ) {
  return UIB.fmtTxHash( h, hs, UIB.txClassSmall, tag );
}

UIB.clipVal = function( id, minval, maxval ) {
  var v = UIH.getel( id );
  v = Bitcoin.Util.parseValue2( v );
  var mxv;
  if (maxval)
    mxv = Bitcoin.Util.parseValue2( maxval );
  if (mxv && v.compareTo(mxv) > 0)
    v = mxv;
  var mnv;
  if (minval)
    mnv = Bitcoin.Util.parseValue2( minval );
  if (mnv && v.compareTo(mnv) < 0)
    v = mnv;
  UIB.setVal( id, v );
  return v;
}

UIB.getVal = function( id, statid, minval, maxval, clip, dflt ) {
  var v = UIH.getel( id );
  if (dflt && !v)
    v = dflt;
  v = v.split( "." );
  if (v[0])
    v[0] = v[0].replace( /[^0-9+\/]/ig, "" );
  else
    v[0] = "0";
  if (v[1])
    v[1] = v[1].replace( /[^0-9+\/]/ig, "" );
  else
    v[1] = "0";
  v = v[0] + '.' + v[1];
  v = Bitcoin.Util.parseValue2( v );
  var mxv;
  if (maxval)
    mxv = Bitcoin.Util.parseValue2( maxval );
  if (mxv)
    if (v.compareTo(mxv) > 0)
      if (clip)
        v = mxv;
      else
        if (statid)
          return UIH.errstat( statid, 
                   "Amount exceeds available" );
  var mnv;
  if (minval)
    mnv = Bitcoin.Util.parseValue2( minval );
  if (mnv)
    if (v.compareTo(mnv) < 0)
      if (clip)
        v = dflt ? Bitcoin.Util.parseValue2(dflt) : mnv;
      else
        if (statid)
          return UIH.errstat( statid, 
                        "Minimum amount is " + minval );
  if (clip)
    UIB.setVal( id, v );
  return v;
}

UIB.fmtVal = function( v, deflt, pfx, cls, forceshow ) {
  if (!pfx) pfx = "";
  var vs = "";
  if (v) {
    vs = Bitcoin.Util.formatValue( v );
    if (v.compareTo( BigInteger.ZERO ) <= 0)
      if (!forceshow)
        vs = "";
  }
  if (vs)
    return pfx + "<span class='" + cls + "'>" + vs + "</span>";
  else
    vs = deflt ? deflt : "";
  return vs;
}

UIB.setVal = function( id, v, deflt, pfx, cls, forceshow ) {
  if (cls)
    return UIH.setel( id, UIB.fmtVal(v,deflt,pfx,cls,forceshow) );
  if (!pfx) pfx = "";
  if (v)
    UIH.setel( id, pfx+Bitcoin.Util.formatValue(v) );
  else
    UIH.setel( id, pfx+(deflt?deflt:"0.00") );
}

UIB.importData = function( wallet, impData, onProgress ) {
  var res = Bitcoin.ImpExp.BBE.import( impData, wallet, onProgress );
  if (!res || (res.txsAccepted==0 && res.txsRejected>0))
    return {invalid:true};
  else
    if (res.txsAccepted == 0)
      return {nodata:true};
  return {result:res};
}

UIB.showSendTx = function( sendtx, idJSON, idHex, idSize ) {
  if (sendtx) {
    var ts = Bitcoin.ImpExp.BBE.exportTx( sendtx, true );
    UIH.setel( idJSON, ts['JSON'] );
    var buf = sendtx.serialize();
    var txhex = Crypto.util.bytesToHex( buf );
    UIH.setel( idHex, txhex );
    UIH.setel( idSize, 
               "<span class='small'>size:</span>" + buf.length );
  }
  else
    UIH.clrel( idSize ),
    UIH.clrel( idJSON ),
    UIH.clrel( idHex );
}

UIB.setupTest = function( sendtx ) {
  if (!UIB.__TEST__)
    return;
  if (UIH.getel( '__TEST__Input' ) == "") {
    var t = Bitcoin.ImpExp.BBE.sampleTx;
    t = JSON.parse( t );
    UIH.setel( '__TEST__Input', JSON.stringify(t,null,2) );
  }
  UIB.showSendTx( sendtx, 'txJSON', 'txHex' );
}

UIB.fmtOutputAddr = function( a ) {
  if (typeof(a) == 'string' && a.length == 130)
    a = Bitcoin.Address.fromPubKey( a );
  a = UIB.lookupAddr( a );
  var t = UIB.getAddrTags( a );
  var n = a.toString();
  if (t.name)
    n = t.name + " (" + n.substr(0,10) + "...)";
    //n = t.name.length>13 ? t.name.substr(0,10)+"..." : t.name;
  return n;
}

UIB.fmtOutputSendInfo = function( M, addrs ) {
  var descr = "";
  if (addrs.length > 1)
    descr += "Multisig: " + M + " of";// + os.N;
  else
    descr += "Spendable by";
  for( var i=0; i<addrs.length; i++ )
    descr += //(N>1 ? " N"+(i+1)+":" : " ") + 
               " " + UIB.fmtOutputAddr(addrs[i]);
  return descr;
}

UIB.fmtOutputInfo = function( os ) {
  if (!os)
    return "";
  //"Output 2 of 3, spendable by "
  //"Output 2 of 3, multisig: 2 of "
  var descr = "";
  if (os.descr) {
    descr = "Output " + (os.index+1) + " of " + 
                              os.tx.outs.length + ", ";
    descr += UIB.fmtOutputSendInfo( os.M, os.addrs );
  }
  //descr += os.unconfirmed ? ", unconfirmed," : "";
  //descr += os.willSpend ? ", will spend" : "";
  return descr;
}

UIB.fmtMultisigTitle = function( Multisig ) {
  var N = Multisig.pubkeys ? Multisig.pubkeys.length : Multisig.addrs.length;
  return "<span class='small ltgray'>MULTISIG </span>" + 
         "<span class=''>" + Multisig.M + "</span>" +
         "<span class='medsz ltgray'> of </span>" + 
         "<span class=''>" + N + "</span>";
}

UIB.showOutputInfo = function( ids, os ) {
  os = os ? os : {tx:{}};
  UIB.setVal( ids.info_val, os.value, "&nbsp;&nbsp;", "", 
              os.unconfirmed ? "" :
                 (os.willSpend?"willspendtag":"wontspendtag") );
  UIB.setTxHash( ids.info_txhash, os.txHash, 40, os.tx.timestamp );
  //Output 2 of 3, spendable by
  var descr = "";
  if (os.txHash)
    descr = "Output " + (os.index+1) + " of " + 
                  os.tx.outs.length + " in: ",
    UIH.setel( ids.info_index, descr );
  descr = "";
  if (os.descr) {
    if (os.N > 1)
      descr += UIB.fmtMultisigTitle( os );
    else
      descr += "spendable by:";
  }
  UIH.setel( ids.info_descr, descr );
  if (ids.info_addrs)
    for( var i=0; i<UIB.MAXN; i++ )
      if (i<os.N)
        UIB.setAddr( ids.info_addrs[i], os.addrs[i], null, null,
                os.N>1 ? "<span class='small'>N" + (i+1) + "</span> " : "" );
      else
        UIH.clrel( ids.info_addrs[i] );
  UIH.setel( ids.info_unconfirmed, os.unconfirmed?"unconfirmed":"" );
}


//----tx output viewer controller----

UIB.txv = {};
UIB.txv.ids = { //default ids
  stat:'tv_stat',
  load:'tv_load',
  loadfile:'tv_loadfile',
  loadtext:'tv_loadtext',
  loadsrc:'tv_loadsrc',
  text:'tv_text',
  addr:'tv_addr',
  loadinfo:'tv_loadinfo',
  priv:'tv_priv',
  list:'tv_outputs',
  clear:'tv_clear',
  export:'tv_export',
  exporteddata:'tv_exporteddata',
  unconfirmed:'tv_unconfirmed'
}
UIB.txv.coldefs = [ 
  {class:'listcol',act:true,name:'val'},
  {class:'txhashcell',act:false,name:'txhash'}
];
UIB.txvController = function( ) {
  this.onOtherDataChg = this.txv_onOtherDataChg;
  this.setAddrs = this.txv_setAddrs;
  this.loadStart = this.txv_loadStart;
  this.loadEnd = this.txv_loadEnd;
  this.processLoadedData = this.txv_processLoadedData;
  this.clearData = this.txv_clearData;
  this.exportData = this.txv_exportData;
  this.getColCls = this.txv_getColCls;
  this.getColVal = this.txv_getColVal;
  this.getColAlt = this.txv_getColAlt;
  this.verify = this.txv_verify;
}
UIB.txvController.prototype = new UIH.ListController();
UIB.txvController.prototype.tv_init = function( ids, coldefs ) {
  this.list_init( ids?ids:UIB.txv.ids, coldefs?coldefs:UIB.txv.coldefs );
  UIB.setupTest();
  if (this.ids.text && UIH.getel(this.ids.text) == "") {
    var t = Bitcoin.ImpExp.BCI.sampleTx;
    t = JSON.parse( t );
    UIH.setel( this.ids.text, JSON.stringify(t,null,2) );
  }
  UIH.enel( this.ids.info_chk, false );
  this.controllers = {};
}
UIB.txv.createController = function( ids, coldefs ) {
  var t = new UIB.txvController();
  t.tv_init( ids, coldefs );
  return t;
}
UIB.txvController.prototype.txv_onOtherDataChg = function( other, msg ) {
  if (other instanceof UIB.addrCacheController)
    this.refresh();
  else
    if (other == this.controllers.addrs)
      this.setAddrs( other.arr );
    else
      if (other == this.controllers.loadaddr && msg == 'ok') {
        this.loadAddr = other.getAddr();
        this.loadFrom( 'URL', this.ids.list );
      }
}
UIB.txvController.prototype.txv_verify = function( id ) {
  if (id == this.ids.info_chk)
    UIH.visel( this.ids.info_pane, UIH.getelchk(id) );
  return true;
}
UIB.txvController.prototype.getWallet = function() {
  return this.wallet;
}
UIB.txvController.prototype.onColHov = function( i, col, os, coldef ) {
  UIB.showOutputInfo( this.ids, os );
}
UIB.txvController.prototype.txv_getColVal = function( row, col, coldef, o ) {
  if (coldef.name == 'val')
    return Bitcoin.Util.formatValue( o.value );
  if (coldef.name == 'txhash')
    return UIB.fmtTxHash2( o.txHash, 23, o.tx.timestamp, UIB.txClassSmall );
  return "";
}
UIB.txvController.prototype.txv_getColAlt = function( i, col, coldef, o ) {
  if (coldef.name == 'val' ||
      coldef.name == 'txhash')
    return UIB.fmtOutputInfo( o );
  return "";
}
UIB.txvController.prototype.txv_getColCls = function( row, col, coldef, o ) {
  if (coldef.name == 'val') 
    return o.unconfirmed ? 'unconfirmed' : 'wontspend';
  return coldef.class;
}
UIB.txvController.prototype.refresh = function() {
  if (!this.wallet)
    return;
  UIH.clrel( this.ids.exporteddata );
  var s;
  if (this.selectOutputs)
    s = this.selectOutputs();
  else
    throw new Error( "Subclass missing or malformed" );
  if (!s)
    return UIH.errstat( this.ids.stat, "Unexpected error" );
  this.populate( s.outsStats );
  if (s.unconfirmed.compareTo(BigInteger.ZERO) > 0)
    UIB.setVal( this.ids.unconfirmed, s.unconfirmed, "",
                " <span class='small'>unconfirmed:</span>", 
                "unconfirmedtag small" );
  else
    UIH.clrel( this.ids.unconfirmed );
  UIB.showOutputInfo( this.ids, s.outsStats[0] );
  UIH.visel( this.ids.info_pane, 
             UIH.getelchk(this.ids.info_chk) && s.outsStats.length>0 );
  UIH.enel( this.ids.info_chk, s.outsStats.length>0 );
  if (this.finishRefresh)
    s = this.finishRefresh( s );
  return s;
}
UIB.txvController.prototype.txv_setAddrs = function( addrs ) {
  this.addrs = addrs ? addrs : [];
  if (this.wallet)
    this.wallet.addAddrs( this.addrs, true );
  this.dataChanged();
}
UIB.txvController.prototype.txv_clearData = function() {
  UIH.endProcess( this.ids.stat );
  this.wallet = null;
  this.wallet = new Bitcoin.Wallet();
  this.setAddrs( this.addrs?this.addrs:[] );
  UIH.clrel( this.ids.loadinfo );
  UIH.clrel( this.ids.stat );
}
UIB.txvController.prototype.txv_exportData = function() {
  if (this.wallet) {
    var t = Bitcoin.ImpExp.BBE.export( this.wallet );
    if (t.txsRejected)
      UIH.clrel( this.ids.exporteddata ), 
      UIH.errstat( this.ids.stat, "Failed exporting data" );
    else
      UIH.setel( this.ids.exporteddata, t.text );
  }
}
UIB.txvController.prototype.getLoadURLs = function( ) {
  var loadFromURL = UIH.getel( this.ids.loadsrc );
  if (!loadFromURL) loadFromURL = UIB.addrHRefLoad;
  if (this.loadAddr) {
    var url = loadFromURL + this.loadAddr;
    return [url];
  }
  var urls = [];
  if (this.addrs)
    for( var i=0; i<this.addrs.length; i++ )
      urls[i] = loadFromURL + this.addrs[i];
  return urls;
}
UIB.txvController.prototype.txv_processLoadedData = function( 
                                              data, i, validate ) {
  var c = this;
  function onProgress( i ) {
    UIH.setstat( c.ids.stat, (validate?"Validating":"Importing") +
                             " transactions (" + (i+1) + ")" );
  }
  var w = validate ? this.load.tmpwallet : this.wallet;
  var ret = UIB.importData( w, data, onProgress );
  if (ret.result && !validate)
    this.load.txsAccepted += ret.result.txsAccepted,
    this.load.txsRejected += ret.result.txsRejected;
  return ret;
}
UIB.txvController.prototype.txv_loadEnd = function() {
  UIH.setel( this.ids.loadinfo, this.load.txsAccepted ? 
                (this.load.txsAccepted+" transactions accepted "
                   + (this.load.txsRejected ? 
                         "(" + this.load.txsRejected + " rejected)" : ""))
                : "" );
  this.load.tmpwallet = null;
}
UIB.txvController.prototype.txv_loadStart = function( from, validate ) {
  UIH.clrel( this.ids.loadinfo );
  if (from == "URL" && !this.loadAddr)
    if (!this.addrs || !this.addrs.length)
      return UIH.errstat( this.ids.stat, "Wallet address(es) needed" );
  this.loadAddr = null;
  if (!this.wallet) {
    this.wallet = new Bitcoin.Wallet();
    this.wallet.addAddrs( this.addrs?this.addrs:[] );
  }
  this.load.txsRejected = 0, this.load.txsAccepted = 0;
  this.load.tmpwallet = new Bitcoin.Wallet();
  this.load.tmpwallet.addAddrs( this.addrs?this.addrs:[] );
  return true;
}



//----wallet (spendable outputs) controller----

UIB.wallet = {};
UIB.wallet.ids = { //default ids
  stat:'w_stat',
  clear:'w_clear',
  export:'w_export',
  exporteddata:'w_exporteddata',
  load:'w_load',
  loadfile:'w_loadfile',
  loadtext:'w_loadtext',
  loadinfo:'w_loadinfo',
  loadsrc:'w_loadsrc',
  text:'w_text',
  file:'w_file',
  addr:'w_addr',
  priv:'w_priv',
  list:'w_outputs',
  unconfirmed:'w_unconfirmed',

  avail:'w_avail',
  selout:'w_selout',

  selall:'w_selall',
  clkverify:['w_details','w_selall'],

  info_chk:'w_details',
  info_pane:'w_info',
  info_val:'w_infoval',
  info_txhash:'w_infotxhash',
  info_index:'w_infoindex',
  info_descr:'w_infodescr',
  info_addrs:['w_infoaddr1','w_infoaddr2','w_infoaddr3']
}
UIB.wallet.coldefs = [ 
  {class:'listcol',act:true,name:'val'},
  {class:'txhashcell',act:false,name:'txhash'}
];
UIB.walletController = function( ) {
  this.loadEnd = this.wc_loadEnd;
  this.setAddrs = this.wc_setAddrs;
  this.getColCls = this.wc_getColCls;
  this.getColVal = this.wc_getColVal;
}
UIB.walletController.prototype = new UIB.txvController();
UIB.walletController.prototype.wc_init = function( ids ) {
  this.tv_init( ids?ids:UIB.wallet.ids, UIB.wallet.coldefs );
  this.feeEntered = UIB.getVal( this.ids.fee );
  this.controllers = {};
  this.avail = BigInteger.ZERO;
  this.selout = BigInteger.ZERO;
  this.xOuts = [];
  UIH.enel( this.ids.selall, false );
}
UIB.wallet.createController = function( ids ) {
  var c = new UIB.walletController();
  c.wc_init( ids );
  return c;
}
UIB.walletController.prototype.verify = function( id ) {
  if (id == this.ids.selall) {
    this.reselect = 2;
    this.dataChanged();
    return true;
  }
  return this.txv_verify( id );
}
UIB.walletController.prototype.onSel = function( i, col, o ) {
  if (!o)
    return;
  if (this.coldefs[col].name == 'val' ||
      this.coldefs[col].name == 'exclude')
    this.xOuts[i] = !this.xOuts[i];
  return true;
}
UIB.walletController.prototype.wc_getColVal = function( 
                                            row, col, coldef, o ) {
  if (coldef.name == 'exclude')
    return this.xOuts[row] ? '<' : '>';
  return this.txv_getColVal( row, col, coldef, o );
}
UIB.walletController.prototype.wc_getColCls = function( 
                                         row, col, coldef, o ) {
  //if (coldef.name == 'exclude')
    //return this.xOuts[row] ? "chkoffcell" : coldef.class;
  if (coldef.name == 'val') { // || coldef.name == 'exclude') {
    var cls = o.willSpend ? "willspend" : "wontspend";
    //cls = this.xOuts[row] ? "cantspend" : cls;
    return o.unconfirmed ? 'unconfirmed' : cls;
  }
  return this.txv_getColCls( row, col, coldef, o );
}
UIB.walletController.prototype.initSelects = function( all, outs ) {
  this.xOuts = [];
  outs = outs ? outs : this.arr;
  if (!all)
    for( var i=1; i<outs.length; i++ )
      this.xOuts[i] = true;
}
UIB.walletController.prototype.selectOutputs = function() {
  var sendTo = {value:this.wallet.getBalance()};
  var chgTo = {Address:""};
  var ret = this.wallet.selectOutputs( 
                      [sendTo], chgTo, BigInteger.ZERO, true, this.xOuts );
  if (this.reselect)
    this.initSelects( this.reselect==2?true:false, ret.outsStats ),
    ret = this.wallet.selectOutputs( 
                      [sendTo], chgTo, BigInteger.ZERO, true, this.xOuts );
  this.reselect = false;
  return ret;
}
UIB.walletController.prototype.finishRefresh = function( s ) {
  this.avail = s.total.subtract( s.unconfirmed );
  this.selout = s.out;
  var ids = this.ids;
  var u = "<span class='small'>total:</span>";
  UIB.setVal( ids.avail, this.avail, "0.0", u, "wontspendtag", 1 );
  var u = "<span class='small'>selected:</span>";
  UIB.setVal( ids.selout, this.selout, "0.0", u, "willspendtag", 1 );
  UIH.enel( this.ids.selall, this.arr.length>0 );
  return s;
}
UIB.walletController.prototype.getOutVal = function( ) {
  return this.selout;
}
UIB.walletController.prototype.wc_setAddrs = function( addrs ) {
  this.reselect = true;
  return this.txv_setAddrs( addrs );
}
UIB.walletController.prototype.addNewSendTx = function( sendtx ) {
  var txhash = this.getWallet().addTx( sendtx, true );
  if (UIB.__TEST__ && txhash) {
    var nt = Bitcoin.ImpExp.BBE.exportAddTx( sendtx, 
                                   UIH.getel('__TEST__Input'), true );
    UIH.setel( '__TEST__Input', nt );
    UIB.setupTest( sendtx );
  }
  this.reselect = true;
  this.dataChanged( null, false, "", true );
  return txhash;
}
UIB.walletController.prototype.cancelSendTx = function( txhash ) {
  var w = this.getWallet();
  if (w && txhash) {
    w.delTx( txhash, true );
    this.reselect = true;
    this.dataChanged( null, false, "", true );
  }
}
UIB.walletController.prototype.confirmSendTx = function( txhash ) {
  var w = this.getWallet();
  if (w && txhash) {
    w.confirmTx( txhash );
    this.reselect = true;
    this.dataChanged( null, false, "", true );
  }
}
UIB.walletController.prototype.wc_loadEnd = function( ) {
  this.reselect = true;
  return this.txv_loadEnd();
}


//----wallet address list controller----

UIB.walletAddrs = {};
UIB.walletAddrs.ids = { //default ids
  list:'wal_list',
  details:'wal_details',
  clkverify:['wali_showpriv','wal_details'],
  stat:'wal_stat',

  info_details:'wali_details',
  info_addr:'wali_addr',
  info_pub:'wali_pub',
  info_hash160:'wali_hash160',
  info_pass:'wali_pass',
  info_key:'wali_key',
  info_qr:'wali_qr',
  info_showpriv:'wali_showpriv'
}
UIB.walletAddrsController = function( ) {}
UIB.walletAddrsController.prototype = new UIB.addrListController();
UIB.walletAddrsController.prototype.wal_init = function( ids, coldefs ) {
  this.al_init( ids?ids:UIB.walletAddrs.ids, coldefs );
  this.maxWid = 35;
  this.keyHint = true;
}
UIB.walletAddrs.createController = function( ids, coldefs ) {
  var c = new UIB.walletAddrsController();
  c.wal_init( ids, coldefs );
  return c;
}
UIB.walletAddrsController.prototype.onOtherDataChg = function( other, act ) {
  if (other instanceof UIB.addrCacheController)
    this.refresh();
  else
    if (other == this.controllers.addr && act == 'ok') {
      var a = other.getAddr();
      if (a)
        this.addAddr( a );
    }
    else
      if (other == this.controllers.gen && act == 'ok')
        this.addKey( other.getKey() );
}


//----wallet address option (enter or sel from cache) controller----

UIB.walletAddrOpt = {};
UIB.walletAddrOpt.ids = { //default ids
  addclk:'wao_ok',
  addfrom:'wao_addr',
  list:'wao_list',
  addradd:'wao_ok',
  clkverify:['wao_ok'],
  stat:'wao_stat'
}
UIB.walletAddrOptController = function( ) {}
UIB.walletAddrOptController.prototype = new UIB.addrOptListController();
UIB.walletAddrOptController.prototype.wao_init = function( ids, coldefs ) {
  this.aol_init( ids?ids:UIB.walletAddrOpt.ids, coldefs );
}
UIB.walletAddrOpt.createController = function( ids, coldefs ) {
  var c = new UIB.walletAddrOptController();
  c.wao_init( ids, coldefs );
  return c;
}
UIB.walletAddrOptController.prototype.onOtherDataChg = function( other ) {
  if (other instanceof UIB.addrCacheController)
    this.arr = UIB.filterAddrs( other.arr, 'type', 'wallet' ),
    this.refresh();
}


//----select output controller----

UIB.selOut = {};
UIB.selOut.ids = {
  stat:'so_stat',
  list:'so_outputs',
  clear:'so_clear',
  export:'so_export',
  exporteddata:'so_exporteddata',
  load:'so_load',
  loadfile:'so_loadfile',
  loadtext:'so_loadtext',
  loadinfo:'so_loadinfo',
  text:'so_text',
  file:'so_file'
}
UIB.selOut.coldefs = [ 
  {class:'listcol',act:true,name:'val'},
  {class:'txhashcell',act:false,name:'txhash'}
];
UIB.selOutController = function( ) {
  this.load = this.so_load;
}
UIB.selOutController.prototype = new UIB.txvController();
//filter={from:,matching:[]}
UIB.selOutController.prototype.so_init = function( ids, filter ) {
  this.tv_init( ids?ids:UIB.selOut.ids, UIB.selOut.coldefs );
  this.filter = filter;
  this.lockedOn = -1;
}
UIB.selOut.createController = function( ids, filter ) {
  var t = new UIB.selOutController( ids, filter );
  t.so_init( ids, filter );
  return t;
}
UIB.selOutController.prototype.getSelOut = function() {
  if (this.lockedOn >= 0)
    return this.filterResults.outsStats[this.lockedOn];
  return null;
}
UIB.selOutController.prototype.showOut = function( o ) {
}
UIB.selOutController.prototype.onSel = function( i ) {
  if (!this.filterResults || i<0)
    return false;
  this.lockedOn = i;
  this.showOut( this.filterResults.outsStats[i] );
  return false;
}
UIB.selOutController.prototype.selectOutputs = function() {
  this.filterResults = null;
  var s = this.getWallet().queryOutputs( 
                              this.filter.from, this.filter.matching );
  if (s)
    this.filterResults = s;
  return s;
}
UIB.selOutController.prototype.so_loadEnd = function( addrs ) {
  this.lockedOn = -1;
  return this.txv_loadEnd();
}



