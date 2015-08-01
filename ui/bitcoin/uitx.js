/*
  Bitcoin new tx UI controllers
*/
UIB.defaultFee = "0.00001";
UIB.maxFee = "0.0005";


UIB.fmtMemo = function( Data, maxlen, cls ) {
  var data = Data.memo ? Data.memo : Data;
  maxlen -= Data.memo ? 0 : 5;
  maxlen -= cls ? 7 : 2;
  if (data.length > maxlen)
    maxlen -=2,
    data = data.substr( data, maxlen ) + "...";
  data = "'" + data + "'";
  if (cls)
    return "<span class='small ltgray'>" + (Data.memo?"MEMO":"DATA") + 
           " </span><span class=''>" + data + "</span>";
  return data;
}
UIB.memoToHex = function( memo ) {
  var stringToBytes = function( str ) {
    for( var bytes=[],i=0; i<str.length; i++ )
      bytes.push( str.charCodeAt(i) );
    return bytes;
  }
  memo = stringToBytes( memo );
  return Crypto.util.bytesToHex( memo );
}
UIB.hexToMemo = function( data ) {
  var bytesToString = function( bytes ) {
    for( var str=[],i=0; i<bytes.length; i++ )
      if (bytes[i])
        str.push( String.fromCharCode(bytes[i]) );
    return str.join( "" );
  }
  data = Crypto.util.hexToBytes( data );
  return bytesToString( data );
}


//----sendTos outputs controller----

UIB.sendToOuts = {};
UIB.sendToOuts.ids = { //default ids
  list:'sto_outputs',
  out:'sto_out',
  chgval:'sto_chgval',
  fee:'sto_fee',
  //clear:'sto_clear'
  editchg:['sto_fee']
}
UIB.sendToOuts.coldefs = [ 
  {class:'delcell',act:true,clkdel:true},
  {class:'newout',act:true,name:'val'},
  {class:'addrcell',act:false,name:'payto'}
];
UIB.stoController = function( ) {
  //this.getColCls = this.sto_getColCls;
  this.getColVal = this.sto_getColVal;
}
UIB.stoController.prototype = new UIH.ListController();
UIB.stoController.prototype.sto_init = function( controllers, ids, cd ) {
  this.list_init( ids?ids:UIB.sendToOuts.ids,
                  cd?cd:UIB.sendToOuts.coldefs );
  this.controllers = controllers ? controllers : {};
  this.feeEntered = Bitcoin.Util.parseValue2( UIB.defaultFee );
  this.feeMax = Bitcoin.Util.parseValue2( UIB.maxFee );
  if (!UIH.getel( this.ids.fee ))
    UIB.setVal( this.ids.fee, this.feeEntered, "" );
  this.resetVals();
}
UIB.sendToOuts.createController = function( controllers, ids, coldefs ) {
  var t = new UIB.stoController();
  t.sto_init( controllers, ids, coldefs );
  return t;
}
UIB.stoController.prototype.onOtherDataChg = function( other ) {
  if (other == this.controllers.newout)
    this.add( other.getOut() );
  else
    if (other == this.controllers.wallet)
      this.postRefresh();//this.resetVals();
    else
      if (other instanceof UIB.addrCacheController)
        this.refresh();
}
UIB.stoController.prototype.onSel = function( i, col, sendTo, coldef ) {
  if (this.controllers.newout && sendTo)
    this.controllers.newout.setup( sendTo );
}
UIB.stoController.prototype.sto_getColVal = function( 
                                     row, col, coldef, sendTo ) {
  if (coldef.name == 'val')
    if (sendTo.Data) {
      if (sendTo.Data.memo)
        return "<span class='small'>MEMO</span>&nbsp;";
      else
        return "<span class='small'>DATA</span>&nbsp;";
    }
    else
      return Bitcoin.Util.formatValue( sendTo.value );
  if (coldef.name == 'payto')
    if (sendTo.Address)
      return UIB.fmtAddrSmall( sendTo.Address, "", 20 );
    else
      if (sendTo.Multisig)
        return UIB.fmtMultisigTitle( sendTo.Multisig );
      else
        if (sendTo.Data)
          return UIB.fmtMemo( sendTo.Data, 30 );
  return "&nbsp;";
}
UIB.stoController.prototype.getColAlt = function( i, col, coldef, st ) {
  if (coldef.name == 'payto' && !st.Address && st.Multisig)
    return UIB.fmtOutputSendInfo( st.Multisig.M, st.Multisig.pubkeys );
  if (coldef.name == 'payto' && st.Data)
    return st.Data.memo ? st.Data.memo : st.Data;
  return "";
}
UIB.stoController.prototype.getColCls = function( row, col, coldef, st ) {
  if (coldef.name == 'val')
    if (st.Data)
      return 'memoout';
  return coldef.class;
}
UIB.stoController.prototype.clearData = function() {
  this.list_clearData();
}
UIB.stoController.prototype.getOuts = function( ) {
  return this.arr;
}
UIB.stoController.prototype.add = function( sendTo ) {
  if (sendTo)
    this.list_add( sendTo );
  return sendTo;
}
UIB.stoController.prototype.verify = function( id ) {
  if (id == this.ids.addout && this.controllers.out)
    return this.add( this.controllers.out.getOut() );
}
UIB.stoController.prototype.refresh = function( newarr ) {
  this.list_refresh( newarr );
  this.resetVals();
}
UIB.stoController.prototype.onEditChg = function( id ) {
  if (id == this.ids.fee) {
    var fee = UIB.getVal( id );
    if (fee.compareTo(this.feeMax) > 0)
      UIB.setVal( id, this.feeMax );
    this.dataChanged();
  }
}
UIB.stoController.prototype.getVals = function( maxv ) {
  var res = {out:BigInteger.ZERO};
  res.maxv = maxv ? maxv : 
            (this.controllers.wallet ? this.controllers.wallet.getOutVal() :
              BigInteger.ZERO);
  for( var i=0; i<this.arr.length; i++ )
    res.out = res.out.add( this.arr[i].value );
  res.fee = UIB.getVal( this.ids.fee );
  res.total = res.out.add( res.fee );
  res.change = res.maxv.subtract( res.total );
  if (res.change.compareTo(BigInteger.ZERO) <= 0)
    res.change = BigInteger.ZERO;
  return res;
}
UIB.stoController.prototype.resetVals = function( maxv ) {
  var s = this.getVals( maxv );
  var ids = this.ids;
  UIB.setVal( ids.fee, s.fee, "" );
  UIB.setVal( ids.out, s.total, "", "", "willspendtag", true );
  UIB.setVal( ids.chgval, s.change, "", "", "wontspendtag", true );
  UIH.clrel( this.ids.stat );
  return s;
}


//----add output controller----

UIB.newout = {};
UIB.newout.ids = { //default ids
  val:'no_val',
  payto:'no_payto',
  stat:'no_stat',
  add:'no_add',
  editchg:['no_val'],
  clkverify:['no_add']
}
UIB.newOutController = function( ) {}
UIB.newOutController.prototype = new UIH.Controller();
UIB.newOutController.prototype.init = function( controllers, ids ) {
  this.controller_init( ids ? ids : UIB.newout.ids );
  this.controllers = controllers ? controllers : {};
  this.maxval = Bitcoin.Util.parseValue2( "99999999.0" );
  this.sendTo = {};
}
UIB.newout.createController = function( controllers, ids ) {
  var c = new UIB.newOutController();
  c.init( controllers, ids );
  return c;
}
UIB.newOutController.prototype.setSyn = function( ) {
  UIH.clrel( this.ids.stat );
  UIH.clrel( this.ids.payto );
  if (this.sendTo.Multisig)
    UIH.setel( this.ids.payto, UIB.fmtMultisigTitle(this.sendTo.Multisig) );
  if (this.sendTo.Address)
    UIB.setAddr( this.ids.payto, this.sendTo.Address );
  if (this.sendTo.Data)
    UIH.setel( this.ids.payto, UIB.fmtMemo(this.sendTo.Data,43,true) );
}
UIB.newOutController.prototype.refresh = function( ) {
  this.setSyn();
}
UIB.newOutController.prototype.onOtherDataChg = function( whochanged, act ) {
  if (whochanged instanceof UIB.addrCacheController)
    this.refresh();
  else
    if (whochanged == this.controllers.addr ||
        whochanged == this.controllers.multisig ||
        whochanged == this.controllers.memo)
      if (act == 'ok') {
        var sendTo = whochanged.getOut();
        if (sendTo)
          this.sendTo = sendTo;
        else
          this.sendTo = {};
        this.setSyn();
      }
}
UIB.newOutController.prototype.setup = function( sendTo ) {
  this.sendTo = sendTo;
  UIB.setVal( this.ids.val, sendTo.value );
  if (sendTo.Address) {
    if (this.controllers.addr)
      this.controllers.addr.setup( sendTo.Address );
  }
  else 
    if (this.controllers.multisig && sendTo.Multisig)
      this.controllers.multisig.setup( sendTo.Multisig );
    else
      if (this.controllers.memo && sendTo.Data)
        this.controllers.memo.setup( sendTo.Data );
  this.setSyn();
}
UIB.copyOut = function( sendTo ) {
  var nst = {};
  if (sendTo.Address)
    nst.Address = UIB.createAddr( sendTo.Address.toString(), 
                   UIH.copyData(UIB.getAddrMetaData(sendTo.Address).tags) );
  else
    if (sendTo.Multisig)
      nst.Multisig = UIH.copyData( sendTo.Multisig );
    else
      if (sendTo.Data)
        nst.Data = UIH.copyData( sendTo.Data );
  return nst;
}
UIB.newOutController.prototype.getOut = function( ) {
  UIH.clrel( this.ids.stat );
  if (!this.sendTo.Address && !this.sendTo.Multisig && !this.sendTo.Data)
    return UIH.errstat( this.ids.stat, "Pay to needed" );
  var sendTo = UIB.copyOut( this.sendTo );
  sendTo.value = UIB.getVal( this.ids.val );
  if (sendTo.Data)
    sendTo.value = BigInteger.ZERO;
  else
    if (!sendTo.value || sendTo.value.compareTo(BigInteger.ZERO) <= 0)
      return UIH.errstat( this.ids.stat, "Amount needed" );
  return sendTo;
}
UIB.newOutController.prototype.verify = function( id ) {
  if (id == this.ids.add)
    if (this.getOut()) {
      this.dataChanged();
      return true;
    }
}
UIB.newOutController.prototype.onEditChg = function( id ) {
  UIH.clrel( this.ids.stat );
  if (id == this.ids.val)
    UIB.clipVal( id, "0.0", this.maxval );
}


//----pay to address controller----

UIB.payTo = {};
UIB.payTo.ids = { //default ids
  //settosel:['no_payto'],
  addclk:'pt_ok',
  addfrom:'pt_addr',
  name:'pt_name',
  list:'pt_list',
  addradd:'pt_ok',
  clkverify:['pt_ok'],
  stat:'pt_stat'
}
UIB.payToController = function( ) {}
UIB.payToController.prototype = new UIB.addrOptListController();
UIB.payToController.prototype.pt_init = function( ids, coldefs ) {
  this.aol_init( ids?ids:UIB.payTo.ids, coldefs );
}
UIB.payTo.createController = function( ids, coldefs ) {
  var c = new UIB.payToController();
  c.pt_init( ids, coldefs );
  return c;
}
UIB.payToController.prototype.getOut = function( ) {
  var a = this.getAddr();
  if (a)
    return {Address:a};
}


//----multisig controller----

UIB.multisig = {MAXN:16};
UIB.multisig.ids = { //default ids
  clkverify:['ms_ok','ms_Mi','ms_Md'],
  ok:'ms_ok',
  N:'ms_N',
  M:'ms_M',
  //synopsis:'no_payto',
  Minc:'ms_Mi',
  Mdec:'ms_Md',
  list:'ms_list',
  stat:'ms_stat'
}
UIB.multisigController = function() {}
UIB.multisigController.prototype = new UIB.addrListController();
UIB.multisigController.prototype.init = function( ids, maxN ) {
  this.al_init( ids?ids:UIB.multisig.ids );
  this.maxN = maxN ? maxN : UIB.multisig.MAXN;
  this.maxWid = 24;
  this.resetM();
}
UIB.multisig.createController = function( ids, maxN ) {
  var c = new UIB.multisigController();
  c.init( ids, maxN );
  return c;
}
UIB.multisigController.prototype.setup = function( Multisig ) {
  this.arr = [];
  UIH.setel( this.ids.M, Multisig.M.toString() );
  for( var i=0; i<Multisig.pubkeys.length; i++ )
    this.arr[i] = UIB.pubToAddr( Multisig.pubkeys[i] );
  return this.refresh();
}
UIB.multisigController.prototype.refresh = function( ) {
  UIH.setel( this.ids.N, this.getN().toString() );
  this.resetM();
  return this.list_refresh();
}
UIB.multisigController.prototype.onOtherDataChg = function( other, act ) {
  if (other == this.controllers.pub && act == 'ok') {
    var a = other.getPubAddr();
    if (a && this.getN() != this.maxN)
      this.addAddr( a );
  }
  else
    if (other instanceof UIB.addrCacheController)
      this.refresh();
}
UIB.multisigController.prototype.getOut = function( ) {
  var sendTo = {};
  sendTo.Multisig = {M:this.getM()};
  sendTo.Multisig.pubkeys = this.getPubKeys();
  if (sendTo.Multisig.pubkeys)
    return sendTo;
}
UIB.multisigController.prototype.getN = function( ) {
  return this.arr.length;
}
UIB.multisigController.prototype.getM = function( ) {
  return UIH.getint( this.ids.M );
}
UIB.multisigController.prototype.getPubKeys = function( ) {
  var N = this.getN();
  var pubs = [];
  for( var i=0,a; i<N; i++ ) {
    a = this.arr[i];
    if (a)
      pubs[i] = UIB.getAddrMetaData(a).tags.pubkey;
    if (!pubs[i])
      return null;
  }
  return pubs;
}
UIB.multisigController.prototype.resetM = function( M ) {
  UIH.clrel( this.ids.stat );
  var N = this.getN();
  M = M ? M : this.getM();
  M = M <= N ? (M < 1 ? 1 : M) : ( !N ? 1 : N);
  UIH.setel( this.ids.M, M.toString() );
}
UIB.multisigController.prototype.M = function( i ) {
  var M = this.getM();
  M += i;
  this.resetM( M );
}
UIB.multisigController.prototype.verify = function( id ) {
  if (id == this.ids.Minc) msc.M(1);
  if (id == this.ids.Mdec) msc.M(-1);
  if (id == this.ids.ok) {
    if (!this.arr.length || !this.getM())
      return UIH.errstat( this.ids.stat, 
                          "Public key(s) needed" );
    UIH.clrel( this.ids.stat );
    this.broadcastChg( 'ok' );
    return true;
  }
}


//----memo/data controller----

UIB.memo = {};
UIB.memo.ids = { //default ids
  stat:'memo_stat',
  memo:'memo_text',
  accept:'memo_ok',
  hexchk:'memo_hex',
  clkverify:['memo_ok','memo_hex']
}
UIB.memoController = function( ) {}
UIB.memoController.prototype = new UIH.Controller();
UIB.memoController.prototype.init = function( ids ) {
  this.controller_init( ids ? ids : UIB.memo.ids );
}
UIB.memo.createController = function( ids ) {
  var c = new UIB.memoController();
  c.init( ids );
  return c;
}
UIB.memoController.prototype.setup = function( Data ) {
  UIH.chkel( this.ids.hexchk, !Data.memo );
  this.show( Data );
}
UIB.memoController.prototype.onOtherDataChg = function( other ) {
}
UIB.memoController.prototype.getOut = function( ) {
  var d = {Data:null};
  if (UIH.getelchk( this.ids.hexchk ))
    d.Data = UIH.getel( this.ids.memo );
  else
    d.Data = {memo:UIH.getel( this.ids.memo )};
  return d;
}
UIB.memoController.prototype.show = function( Data ) {
  if (Data)
    UIH.setel( this.ids.memo, Data.memo?Data.memo:Data );
  else
    UIH.clrel( this.ids.memo );
  UIH.clrel( this.ids.stat );
}
UIB.memoController.prototype.refresh = function( ) {
  //this.show( );
}
UIB.memoController.prototype.verify = function( id ) {
  if (id == this.ids.accept) {
    if (!UIH.getel( this.ids.memo ))
      return UIH.errstat( this.ids.stat, 
                          "Memo/data needed" );
    else
      if (UIH.getelchk( this.ids.hexchk )) {
        if (!UIB.testHex( UIH.getel(this.ids.memo), 80 ))
          return UIH.errstat( this.ids.stat, 
                              "hex/80 length max" );
      }
      else
        if (UIH.getel(this.ids.memo).length > 40)
          return UIH.errstat( this.ids.stat, 
                              "40 length max" );
    UIH.clrel( this.ids.stat );
    this.broadcastChg( 'ok' );
    return true;
  }
  if (id == this.ids.hexchk) {
    var t;
    if (UIH.getelchk( this.ids.hexchk ))
      t = UIB.memoToHex( UIH.getel(this.ids.memo) );
    else
      t = UIB.hexToMemo( UIH.getel(this.ids.memo) );
    UIH.setel( this.ids.memo, t );
    UIH.clrel( this.ids.stat );
    return true;
  }
  return false;
}


//----chg to sel controller----

UIB.chgTo = {};
UIB.chgTo.ids = { //default ids
  settosel:['tx_chgto'],
  clkverify:['ct_ok'],
  list:'ct_list'
}
UIB.chgToController = function( ) {}
UIB.chgToController.prototype = new UIB.selAddrListController();
UIB.chgToController.prototype.ct_init = function( ids, coldefs ) {
  this.sal_init( ids?ids:UIB.chgTo.ids, 
                 coldefs?coldefs:UIB.chgTo.coldefs );
  this.showlinks = false;
}
UIB.chgTo.createController = function( ids, coldefs ) {
  var c = new UIB.chgToController();
  c.ct_init( ids, coldefs );
  return c;
}
UIB.chgToController.prototype.onOtherDataChg = function( other ) {
  if (other == this.controllers.addrs) {
    var sa = this.get();
    this.arr = other.arr;
    this.selrow = UIH.indexOf( this.arr, sa );
    if (this.selrow < 0 && this.arr.length)
      sa = this.arr[0], this.selrow=0;
    this.refresh();
  }
  else
    if (other instanceof UIB.addrCacheController)
      this.refresh();
}


//----create tx controller----

UIB.newtx = {};
UIB.newtx.ids = { //default ids
  create:'ntx_create',
  stat:'ntx_stat',
  size:'ntx_size',
  hex:'ntx_hex',
  hexsave:'ntx_hexsave',
  'JSON':'ntx_json',
  JSONshow:'ntx_jsontog',
  send:'ntx_send',
  cancelshow:'ntx_canceltog',
  cancel:'ntx_cancel',
  confirm:'ntx_confirm',
  confirmshow:'ntx_confirmtog',
  clkverify:['ntx_create','ntx_send','ntx_cancel','ntx_confirm']
}
UIB.newTxController = function( ids ) {}
UIB.newTxController.prototype = new UIH.Controller();
UIB.newTxController.prototype.init = function( ids, controllers ) {
  this.controller_init( ids ? ids : UIB.newtx.ids );
  this.controllers = controllers ? controllers : {};
  UIB.showSendTx( null, this.ids['JSON'], this.ids.hex );
  this.setup();
}
UIB.newtx.createController = function( ids, controllers ) {
  var c = new UIB.newTxController();
  c.init( ids, controllers );
  return c;
}
UIB.newTxController.prototype.setup = function( ) {
  var text = UIH.getel( this.ids.hex );
  var en = text != "";
  UIH.getelobj(this.ids.hexsave).style.display = en ? "inline-block" : "none";
  UIH.getelobj(this.ids.hexsave).href = 
                        'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
  UIH.enel( this.ids.confirmshow, en );
  UIH.enel( this.ids.cancelshow, en );
  UIH.enel( this.ids.JSONshow, en );
  UIH.enel( this.ids.send, en );
  UIH.clrel( this.ids.stat );
}
UIB.newTxController.prototype.wipe = function( ) {
  this.txhash = null;
  this.txouts = null;
  UIH.clrel( this.ids.stat );
  UIH.clrel( this.ids.size );
  UIH.clrel( this.ids.hex );
  UIH.clrel( this.ids['JSON'] );
  this.setup();
}

UIB.newTxController.prototype.prepNewTx = function( wc, newouts, chgto ) {
  var wc = this.controllers.wallet, 
      newouts = this.controllers.newouts, 
      chgto = this.controllers.chgto;
  var ids = this.ids;
  var s = {sendTos:newouts.getOuts()};
  if (!s.sendTos.length)
    return UIH.errstat( ids.stat, "New output(s) needed" );
  var vals = newouts.getVals();
  if (vals.total.compareTo(vals.maxv) > 0)
    return UIH.errstat( ids.stat, "Sufficient unspent(s) needed" );
  s.chgTo = {Address:chgto.get()};
  if (!s.chgTo.Address || !Bitcoin.Address.validate(s.chgTo.Address))
    return UIH.errstat( ids.stat, "Change to address needed" );
  var maxfee = Bitcoin.Util.parseValue2( UIB.maxFee );
  if (vals.fee.compareTo(maxfee) > 0)
    return UIH.errstat( ids.stat, "Excessive fee" );
  s.fee = vals.fee;
  var s2 = [];
  for( var i=0; i<s.sendTos.length; i++ )
    s2.push( s.sendTos[i] );
  if (vals.change.compareTo(BigInteger.ZERO) > 0)
    s2.push( {Address:s.chgTo.Address,value:vals.change} );
  s.sendTos = s2;
  return s;
}

UIB.newTxController.prototype._createAsync = function( ) {
  var This = this;
  function callback( msg, wallet, sendtx, i, ti ) {
    if (msg == "progress" && !This.cancelled)
      UIH.setstat( This.ids.stat, "Signing unspent " + 
                                  (i+1) + " of " + ti + "..." );
    else {
      This.signInProgress = false;
      UIH.controller.lock( false );
      UIH.enel( This.ids.cancelshow, false );
      if (This.cancelled)
        UIH.errstat( This.ids.stat, "Cancelled" );
      else
        if (msg == "fail")
          UIH.errstat( This.ids.stat, "Failed creating transaction" );
        else
          if (msg == "complete") {
            //  add new tx back to wallet to eliminate spent outs
            This.txhash = This.controllers.wallet.addNewSendTx( sendtx );
            UIB.showSendTx( sendtx, This.ids['JSON'], 
                            This.ids.hex, This.ids.size );
            This.txouts = This.controllers.newouts.getOuts();
            This.controllers.newouts.clearData();
            This.setup();
          }
    }
    return This.cancelled;
  }
  UIH.clrel( this.ids.hex );
  UIH.clrel( this.ids['JSON'] );
  this.setup();
  var wallet = this.controllers.wallet.getWallet();
  // prep and write tx
  var s = this.prepNewTx();
  if (!s)
    return false;
  for( var i=0,eckeys=[]; i<this.keys.length; i++ )
    eckeys.push( this.keys[i].key );
  UIH.controller.lock( true, [this.ids.cancel] );
  this.signInProgress = true;
  this.cancelled = false;
  UIH.enel( this.ids.cancelshow, true );
  wallet.createSend2( s.sendTos, s.chgTo, s.fee, eckeys,
                      this.controllers.wallet.xOuts, callback );
}

UIB.newTxController.prototype._create = function( ) {
  UIH.clrel( this.ids.hex );
  UIH.clrel( this.ids['JSON'] );
  this.setup();
  var wallet = this.controllers.wallet.getWallet();
  //  prep and write tx
  var s = this.prepNewTx();
  if (!s)
    return false;
  for( var i=0,eckeys=[]; i<this.keys.length; i++ )
    eckeys.push( this.keys[i].key );
  var sendtx;
  UIH.enel( this.ids.cancelshow, true );
  sendtx = wallet.createSend2( s.sendTos, s.chgTo, s.fee, 
                               eckeys, this.controllers.wallet.xOuts );
  UIH.enel( this.ids.cancelshow, false );
  if (!sendtx)
    return UIH.errstat( this.ids.stat, "Failed creating transaction" );
  //  add new tx back to wallet to eliminate spent outs
  this.txhash = this.controllers.wallet.addNewSendTx( sendtx );
  UIB.showSendTx( sendtx, this.ids['JSON'], this.ids.hex, this.ids.size );
  this.txouts = this.controllers.newouts.getOuts();
  this.controllers.newouts.clearData();
  this.setup();
  UIH.endProcess( this.ids.stat, "" );
}

UIB.newtx._createit = function( id ) {
  UIH.getController(id)._createAsync();
}

UIB.newTxController.prototype.createTx = function( controllers ) {
  controllers = controllers ? controllers : this.controllers;
  this.controllers = controllers;
  if (!controllers.wallet.getWallet())
    return UIH.errstat( this.ids.stat, "Wallet data needed" );
  this.keys = controllers.keys.getKeys( true );
  if (!this.keys)
    return UIH.errstat( this.ids.stat, "Key(s) needed" );
  if (!this.prepNewTx())
    return;
  this._attachment = this;
  //var fc = "UIB.newtx._createit('" + this.ids.create + "');";
  //UIH.doProcess( this.ids.stat, "Signing...", fc );
  this._createAsync( this.ids.create );
}

UIB.newTxController.prototype.confirm = function( ) {
  if (this.controllers.wallet && this.txhash)
    this.controllers.wallet.confirmSendTx( this.txhash );
  this.txouts = null;
  this.txhash = null;
  UIH.enel( this.ids.confirmshow, false );
  UIH.enel( this.ids.cancelshow, false );
}

UIB.newTxController.prototype.cancel = function( ) {
  var w = this.controllers.wallet ?
                           this.controllers.wallet : null;
  if (w && this.txhash)
    w.cancelSendTx( this.txhash );
  if (this.txouts && !this.controllers.newouts.arr.length)
    this.controllers.newouts.reset( this.txouts );
  this.wipe();
}

UIB.newTxController.prototype.verify = function( id ) {
  if (id == this.ids.create)
    return this.createTx();
  if (id == this.ids.send)
    //if (UIH.getel(this.ids.hex))
      return alert( "Direct send disabled in this Beta version - " +
                    "generated raw transaction can be copied/pasted " +
                    "to push transaction service" );
    //else
    //  return this.createTx();
  if (id == this.ids.cancel)
    if (this.signInProgress) {
      this.cancelled = true;
      this.signInProgress = false;
      UIH.controller.lock( false );
    }
    else
      this.cancel();
  if (id == this.ids.confirm)
    this.confirm();
  return true;
}
