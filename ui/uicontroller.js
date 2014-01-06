/*controller superclasses and UI utils*/

var UIH = {
  statcls:'stat',
  errstatcls:'staterr',
  staterrmsg:"A process is already running"
};

UIH.getEventElem = function( eventJS ) {
  if (!eventJS)
    eventJS = window.event;
  if (!eventJS)
    return null;
  var targ = eventJS.target;
  if (!targ)
    targ = eventJS.srcElement;
  return targ;
}

UIH.getelobj = function( elemOrId ) {
  if (!elemOrId)
    return null;
  if (elemOrId instanceof HTMLElement)
    return elemOrId;
  return document.getElementById( elemOrId );
}

UIH.visel = function( elemOrId, vis ) {
  var e = UIH.getelobj( elemOrId );
  if (e)
    if (vis)
      e.style.display = 'inline-block';
    else
      e.style.display = 'none';
}

UIH.chkel = function( elemOrId, chk ) {
  var e = UIH.getelobj( elemOrId );
  if (e) e.checked = chk ? true : false;
}

UIH.getelchk = function( elemOrId ) {
  var e = UIH.getelobj( elemOrId );
  if (e) return e.checked;
  return false;
}

UIH.enel = function( elemOrId, enable ) {
  var e = UIH.getelobj( elemOrId );
  if (e) e.disabled = enable ? false : true;
}

UIH.copyData = function( data ) {
  return JSON.parse( JSON.stringify(data) );
}

UIH.mkids = function( ids, suffix ) {  //make ids from boilerplate
  var newids = {};
  for( var n in ids )
    if (typeof(ids[n]) == 'string')
      newids[n] = ids[n] + suffix;
    else
      newids[n] = UIH.mkids( ids[n], suffix );
  return newids;
}

UIH.getel = function( elemOrId ) {
  var e = UIH.getelobj( elemOrId );
  if (e)
    if ((e instanceof HTMLInputElement) ||
        (e instanceof HTMLTextAreaElement))
      return e.value;
    else
      return e.innerHTML;
  return "";
}

UIH.setel = function( elemOrId, v, tag ) {
  v = v ? v : "";
  var e = UIH.getelobj( elemOrId );
  if (e)
    if ((e instanceof HTMLInputElement) ||
        (e instanceof HTMLTextAreaElement))
      e.value = v;
    else
      e.innerHTML = tag ? (tag+v) : v;
}

UIH.clrel = function( elemOrId ) {
  UIH.setel( elemOrId, "" );
}

UIH.fmt = function( val, cls, before, after ) {
  val = val ? val : "";
  var a = "<span>" + val  + "</span>";
  if (cls)
    a = "<span class='" + cls + "'>" + val  + "</span>";
  return (before?before:'') + a + (after?after:'');
}

UIH.fmtsetel = function( id, val, cls, before, after ) {
  UIH.setel( id, UIH.fmt( val, cls, before, after ) );
}

UIH.populateList = function( listId, list, fmtCallback, addto, insBrks ) {
  var h = '';
  if (addto)
    h = UIH.getel( listId );
  if (list)
    //for( var i=list.length-1; i>=0; i-- ) {
    for( var i=0; i<list.length; i++ ) {
      h += fmtCallback( list[i], i );
      if (i && insBrks)
        h += '<br/>';
    }
  UIH.setel( listId, h );
}

UIH.err = function( str ) {
  alert( str );
  return false;
}

UIH.setstat = function( id, msg, cls ) {
  UIH.fmtsetel( id, msg, cls?cls:UIH.statcls );
}

UIH.seterrstat = function( id, msg, cls ) {
  UIH.fmtsetel( id, msg, cls?cls:UIH.errstatcls );
}

UIH.failProcess = function( idstat, errmsg, soft ) {
  UIH.processRunning = false;
  if (soft)
    UIH.setstat( idstat, errmsg );
  else
    UIH.seterrstat( idstat, errmsg );
  if (UIH.completionCallback)
    UIH.completionCallback( false, soft );
  return false;
}
UIH.errstat = UIH.failProcess; //old name

UIH.endProcess = function( idstat, okmsg ) {
  if (!UIH.processRunning)
    return;
  UIH.processRunning = false;
  UIH.setstat( idstat, okmsg );
  if (UIH.completionCallback)
    UIH.completionCallback( true );
  return true;
}

UIH.continueProcess = function( idstat, msg, doit ) {
  UIH.processRunning = true;
  UIH.setstat( idstat, msg );
  setTimeout( doit, 50 );
  return true;
}

UIH.doProcess = function( idstat, msg, doit, errmsg, complCallback ) {
  if (UIH.processRunning)
    return UIH.setstat( idstat, errmsg?errmsg:UIH.staterrmsg );
  UIH.completionCallback = complCallback;
  return UIH.continueProcess( idstat, msg, doit );
}

UIH.toint = function( n ) {
  n = n.toString();
  n = n.replace( /[^0-9+\/]/ig, "" );
  n = JSON.parse( '{"n":' + (n?n:'0') + '}' );
  return n.n;
}

UIH.getint = function( id, minn, maxn, clip, dflt, statid, msg ) {
  var n = UIH.getel( id );
  if (dflt && !n)
    n = dflt;
  n = UIH.toint( n );
  var mxn;
  if (maxn)
    mxn = new Number( maxn );
  if (mxn)
    if (n > mxn)
      if (clip)
        n = mxn;
      else
        if (statid)
          return UIH.errstat( statid, msg?msg:"Maximum is " + maxn );
  var mnn;
  if (minn)
    mnn = new Number( minn );
  if (mnn)
    if (n < mnn)
      if (clip)
        n = dflt ? new Number(dflt) : mnn;
      else
        if (statid)
          return UIH.errstat( statid, msg?msg:"Minimum is " + minn );
  UIH.setel( id, n.toString() );
  return n;
}

UIH.indexOf = function( arr, item ) {
  var its = item.toString();
  if (arr)
    for( var i=0; i<arr.length; i++ )
      if (arr[i].toString() == its)
        return i;
  return -1;
}
UIH.isIn = function( arr, item ) {return UIH.indexOf(arr,item) >= 0;}

UIH.notify = function( from, notify, msg, data ) {
  for( var i=0; i<notify.length; i++ )
    if (notify[i].onNotify)
      notify[i].onNotify( msg, from, data );
}

UIH.TextLoader = function( id ) {
  this.id = id;
}
UIH.TextLoader.prototype.getName = function( i ) {
  return "";
}
UIH.TextLoader.prototype.loadData = function( obj, i ) {
  obj.onLoaded( i, UIH.getel(this.id) );
}

UIH.FileLoader = function( id ) {
  this.id = id;
}
UIH.FileLoader.prototype.getName = function( i ) {
  return UIH.getelobj(this.id).files[i];
}
UIH.FileLoader.prototype.loadData = function( obj, i ) {
  var f = this.getName( i );
  var done = false;
  var reader = new FileReader();
  reader.onerror = function( ev ) {
    if (!done)
      obj.onLoaded( i, null ), done=true;
  }
  reader.onload = function( ev ) {
    if (!done)
      obj.onLoaded( i, ev.target.result ), done=true;
  }
  reader.readAsText( f );
}

UIH.uniqueURL = function( url ) {
  var cd = new Date();
  var u = url.split( '?' );
  url += u.length > 1 ? '&' : '?';
  url += cd.getTime().toString();
  return url;
}
UIH.URLLoader = function( urls ) {
  this.urls = urls;
}
UIH.URLLoader.prototype.getName = function( i ) {
  return this.urls[i];
}
UIH.URLLoader.prototype.loadData = function( obj, i ) {
  function onProgress( e ) {
    if (e.lengthComputable)
      obj.onLoadProgress( i, (e.loaded/e.total)*100 );
  }
  function transferComplete( e ) {
    var s = this.status;
    var t = this.responseText;
    // kludge for extracting result from yapi 
    var i1 = t.indexOf( "<p>" );
    var i2 = t.indexOf( "</p>" );
    if (i1 < 0 || i2 < 0)
      return obj.onLoaded( i, null, "Invalid response" );
    i1 += 3;
    var t = t.substr( i1, i2-i1 );
    obj.onLoaded( i, t );
    //TEST UIH.setel( 'w_exporteddata', t );
    //myHTML.replace(/<p(.|\s)*?\/p>/g, '');
  }
  function transferFailed( ) {
    var m = this.status==404 ? "URL not found" :
                               "No connection or server unresponsive";
                                 // + (this.status?
                                  //" ("+this.status+")" : "");
    obj.onLoaded( i, null, m );
  }
  function transferCanceled( e ) {
    var s = this.status;
    obj.onLoaded( i, null, "Load canceled" );
  }
  /*function onload( e ) {
    if (this.status == 200)
      obj.onLoaded( i, this.responseText );
    else
      obj.onLoaded( i, null, this.status==404?"Load failed (not found)":
                             "Load failed ("+this.status+")" );
  }*/
  var req = new XMLHttpRequest();
  req.addEventListener( "progress", onProgress, false );
  req.addEventListener( "load", transferComplete, false );
  req.addEventListener( "error", transferFailed, false );
  req.addEventListener( "abort", transferCanceled, false );
  try {
    // kludge to bypass cross domain restriction in JS
    //  TODO: find public exit nodes for loading direct
    var url = UIH.uniqueURL( this.urls[i] );
    var url = 'select * from html where url="' + url + '"';
    url = 'https://query.yahooapis.com/v1/public/yql?q=' +
                                    encodeURIComponent(url);
    //TEST url = "http://www.html5rocks.com/en/tutorials/file/xhr2/";
    req.open( "GET", url, true );
    req.send();
  }
  catch( e ) {
    transferFailed();
  }
}

UIH.HTTPPostText = function( txt ) {
  var xhr = new XMLHttpRequest();
  xhr.open( 'POST', '/server', true );
  xhr.onload = function( e ) {
    if (this.status == 200)
      console.log( this.responseText );
  }
  xhr.send( txt );
}


//----controller interface----
/* controller is one or more controls(ids)

   if ids.clkverify:{} defined, sub.verify called when id clicked
   if ids.chgverify:{} defined, sub.verify called when id changes
     in both cases, sub.onVerifyOk or sub.onVerifyFail is called

   if ids.load,ids.loadfile,ids.loadtext, loader is enabled
     clicks will load from ids.file, ids.text, or this.getLoadURLs()
       (ids.file must be <input type=file>, ids.text <textarea>)
     this.processLoadedData(data,i) called for each file/url
       (this.processLoadedData(data,i,true) called first to validate)

   if ids.clear, this.clearData() called, ids.export, this.exportData()
*/
UIH.controller = {};
UIH.Controller = function( ) {
  // set overridable interface
  this.get = this.controller_get;
  this.set = this.controller_set;
  this.sets = this.controller_sets;
  this.onClk = this.controller_onClk;
  this.onChg = this.controller_onChg;
  this.onVerify = this.controller_onVerify;
  this.willNotify = this.controller_willNotify;
  this.dataChanged = this.controller_dataChanged;
  this.onDataChg = this.controller_onDataChg;
  this.loadFrom = this.controller_loadFrom;
}
UIH.controllers = [];
UIH.Controller.prototype.controller_init = function( ids ) {
  this.ids = ids ? ids : {};
  this.load = {};
  UIH.controllers.push( this );
  if (this.ids.clk)
    for( var i in this.ids.clk )
      this.setIdMethod( this.ids.clk[i], 'onclick', 
                                      UIH.controller__onClk );
  if (this.ids.editchg)
    for( var i in this.ids.editchg )
      this.setIdMethod( this.ids.editchg[i], 'onchange',
                                      UIH.controller__onEditChg );
  if (this.ids.clkverify)
    for( var i in this.ids.clkverify )
      this.setIdMethod( this.ids.clkverify[i], 'onclick', 
                                      UIH.controller__onVerify );
  if (this.ids.chgverify)
    for( var i in this.ids.chgverify )
      this.setIdMethod( this.ids.chgverify[i], 'onchange',
                                      UIH.controller__onVerify );
  if (this.ids.file)
    this.setIdMethod( this.ids.file, 'onchange', 
                                      UIH.controller__onFileChg );
  var lids = [this.ids.load,this.ids.loadfile,this.ids.loadtext,
              this.ids.clear,this.ids.export];
  for( var i in lids )
    if (lids[i])
      this.setIdMethod( lids[i], 'onclick', UIH.controller__onLoadClk );
}
UIH.Controller.prototype._setController = function( elemOrId ) {
  var e = UIH.getelobj( elemOrId );
  if (e) { 
    e.__UIH_controller = this; 
    if (!this.ids.main)
      this.ids.main = elemOrId;
  }
  return e;
}
UIH.getController = function( elemOrId ) {
  return UIH.getelobj(elemOrId).__UIH_controller;
}
UIH.Controller.prototype.setIdMethod = function( elemOrId, meth, fun ) {
  if (this._setController( elemOrId ))
    UIH.getelobj(elemOrId)[meth] = fun;
}
UIH.controller__onClk = function( event ) {
  var e = UIH.getEventElem( event );
  if (!UIH.controller.isLocked( e.id ))
    return UIH.getController(e).onClk( e.id );
}
UIH.controller__onEditChg = function( event ) {
  var e = UIH.getEventElem( event );
  if (!UIH.controller.isLocked( e.id ))
    return UIH.getController(e).onEditChg( e.id );
}
UIH.controller__onVerify = function( event ) {
  var e = UIH.getEventElem( event );
  if (!UIH.controller.isLocked( e.id ))
    return UIH.getController(e).onVerify( e.id );
}
UIH.controller__onFileChg = function( event ) {
  var e = UIH.getEventElem( event );
  if (!UIH.controller.isLocked( e.id ))
    return UIH.getController(e).loadFrom( "file", e.id );
}
UIH.controller__onLoadClk = function( event ) {
  var e = UIH.getEventElem( event );
  if (!UIH.controller.isLocked( e.id ))
    return UIH.getController(e)._loadClk( e.id );
}
UIH.controller.lock = function( lock, except ) {
  UIH.controller.locked = lock;
  UIH.controller.lockedExcept = except;
}
UIH.controller.isLocked = function( id ) {
  return UIH.controller.locked && 
         !UIH.isIn( UIH.controller.lockedExcept, id );
}
UIH.controller._refresh = function( id ) {
  var c = UIH.getController( id );
  c.refresh();
  c.refreshPending = false;
}
UIH.Controller.prototype.postRefresh = function( ) {
  if (!this.ids.main)
    return this.refresh();
  if (!this.refreshPending)
    setTimeout( "UIH.controller._refresh('" + this.ids.main + "');", 10 );
  this.refreshPending = true;
}

UIH.Controller.prototype.controller_onVerify = function( id ) {
  var ok = true;
  if (this.verify)
    ok = this.verify( id );
  if (ok) {
    if (this.onVerifyOk)
      this.onVerifyOk( id );
  }
  else
    if (this.onVerifyFail)
      this.onVerifyFail( id );
  return ok;
}

UIH.Controller.prototype.controller_get = function( id ) {
  return UIH.getel( id );
}
UIH.Controller.prototype.controller_set = function( id, d ) {
  UIH.setel( id, d );
}

UIH.Controller.prototype.controller_sets = function( ids, d ) {
  if (ids)
    for( var i in ids )
      this.set( ids[i], d );
}

UIH.Controller.prototype.onOtherDataChg = function( other ) {
}

UIH.Controller.prototype.refresh = function( ) {
}

UIH.Controller.prototype.broadcastChg = function( act ) {
  for( var i=0; i<UIH.controllers.length; i++ )
    if (UIH.controllers[i] != this)
      UIH.controllers[i].onOtherDataChg( this, act );
}

UIH.Controller.prototype.refreshAll = function( ) {
  for( var i=0; i<UIH.controllers.length; i++ )
    if (UIH.controllers[i] != this)
      UIH.controllers[i].postRefresh();
}

UIH.Controller.prototype.controller_dataChanged = function( 
                             newdata, nonotify, act, nopost ) {
  if (nopost)
    this.refresh();
  else
    this.postRefresh();
  if (!nonotify)
    this.broadcastChg( act );
}

UIH.Controller.prototype.intakeLoadedData = function() {
  for( i=0,f=0,v=0; i<this.load.datas.length; i++ ) {
    var res = this.processLoadedData( this.load.datas[i], i );
    if (res.invalid)
      v++;
    else
      if (res.nodata)
        f++;
  }
  if (f == this.load.datas.length)
    return UIH.failProcess( this.ids.stat, "No data", true );
  else
    if ((v+f) == this.load.datas.length)
      return UIH.errstat( this.ids.stat, "Invalid data" );
  if (this.loadEnd)
    this.loadEnd();
  this.dataChanged();
  UIH.endProcess( this.ids.stat, "&nbsp;" );
}

UIH.Controller.prototype.onLoadProgress = function( i, percent ) {
  var m = UIH.getel( this.ids.stat );
  return UIH.errstat( this.ids.stat, m+" ("+percent+"%)" );
}

UIH.Controller.prototype.onLoaded = function( i, data, errmsg ) {
  if (!data && data !== "")
    return UIH.errstat( this.ids.stat, errmsg?errmsg:"Load failed" );
  this.load.datas[i] = data;
  var res = this.load.validationPassEnabled ? 
                           this.processLoadedData(data,i,true) : {};
  if (res.invalid)
    return UIH.errstat( this.ids.stat, "Invalid data" );
  i++;
  if (i < this.load.sources.length)
    this._loadnext( i );
  else
    this.intakeLoadedData();
}

UIH.controller__loadnext = function( id, i ) {
  var c = UIH.getController( id );
  c.load.loader.loadData( c, i );
}

UIH.Controller.prototype._loadnext = function( i ) {
  var c = this;
  function cb( ok, soft ) {
    if (ok && c.onLoadOk)
      c.onLoadOk();
    if (!ok && c.onLoadFail)
      c.onLoadFail( soft );
  }
  var fc = "UIH.controller__loadnext('" + this.load.id + "'," + i + ");";
  var msg = "&nbsp;";
  if (this.load.from != 'text')
    var msg = "Loading " + this.load.from + " " + (i+1) + "...";
  if (i)
    UIH.continueProcess( this.ids.stat, msg, fc );
  else
    UIH.doProcess( this.ids.stat, msg, fc, "", cb );
}

UIH.Controller.prototype.controller_loadFrom = function( from, id ) {
  this.load = {'from':from,'id':id,sources:["1"],datas:[]};
  if (from == 'URL')
    this.load.sources = this.getLoadURLs();
  if (from == 'file')
    this.load.sources = UIH.getelobj(this.ids.file).files;
  this.load.loader = from == 'text' ? new UIH.TextLoader(this.ids.text) : 
                     (from == 'file' ? new UIH.FileLoader(this.ids.file) : 
                      new UIH.URLLoader(this.load.sources) );
  if (this.loadStart)
    if (!this.loadStart( from, id ))
      return;
  this._loadnext( 0 );
}

UIH.Controller.prototype._loadClk = function( id ) {
  var ret = true;
  if (id == this.ids.clear)
    ret = this.clearData();
  else
    if (id == this.ids.export)
      ret = this.exportData();
    else {
      var fr = id == this.ids.loadtext ? "text" : 
                        (id == this.ids.loadfile ? "file" : "URL");
      if (id == this.ids.loadfile)
        UIH.getelobj(this.ids.file).click();
      else
        this.loadFrom( fr, id );
    }
  if (this.onLoadClk)
    this.onLoadClk( id );
}


//----list controller superclass----

UIH.list = {};
UIH.list.ids = { 
  list:'l_list', 
  //optionals
  stat:'l_stat',
  load:'l_loadfromurl',
  loadfile:'l_loadfromfile',
  loadtext:'l_loadfromtext',
  settosel:['l_settosel'], 
  addfrom:'l_addfrom' 
}
UIH.list.colDefs = [ 
  {class:'listcol',act:true}
];

UIH.ListController = function( ) {
  // set overridable interface
  this.load = this.list_load;
  this.loadArr = this.list_loadArr;
  this.refresh = this.list_refresh;
  this.clearData = this.list_clearData;
  this.get = this.list_get;
  this.add = this.list_add;
  this.del = this.list_del;
  this.select = this.list_select;
  this.getColVal = this.list_getColVal;
  this.getColCls = this.list_getColCls;
}
UIH.ListController.prototype = new UIH.Controller();
UIH.ListController.prototype.list_init = function( ids, coldefs, arr ) {
  if (!ids)
    throw new Error( "Parameter missing" );
  this.controller_init( ids );
  this.coldefs = coldefs?coldefs:UIH.list.colDefs;
  this.arr = arr?arr:[];
  this.selrow = -1;
  this.selcol = -1;
  this.hovrow = -1;
  this.hovcol = -1;
  this._setController( this.ids.list );
}
UIH.list.createController = function( ids, cols, arr ) {
  var c = new UIH.ListController();
  c.list_init( ids, cols, arr );
  return c;
}

UIH.list._onClk = function( i, col, listId ) {
  if (UIH.controller.isLocked( listId ))
    return;
  var c = UIH.getController( listId );
  if (col>=0 && c.coldefs[col].clkdel)
    c.del( i );
  else
    c.select( i, col );
}

UIH.list._onHover = function( i, col, listId ) {
  if (UIH.controller.isLocked( listId ))
    return;
  var c = UIH.getController( listId );
  c.hovrow = i;
  c.hovcol = col;
  if (c.onColHov)
    if (c.onColHov( i, col, c.arr[i], c.coldefs[col] ))
      c.postRefresh();
}

UIH.ListController.prototype.list_get = function( id ) {
  if (id)
    return this.controller_get( id );
  return (this.selrow>=0 && this.selrow<this.arr.length) ? 
         this.arr[this.selrow] : "";
}

UIH.ListController.prototype.getStr = function( id ) {
  if (id)
    return this.controller_get( id );
  return this.get().toString();
}

UIH.ListController.prototype.list_select = function( i, col, datachg ) {
  i = i<this.arr.length ? i : -1;
  this.selrow = i;
  this.selcol = col;
  var redraw = datachg;
  if (this.onSel)
    redraw = this.onSel( i, col, i<0?null:this.arr[i], datachg ) || datachg;
  if (this.onSelOk)
    this.onSelOk( i, col );
  if (redraw)
    this.dataChanged();
  else
    this.sets( this.ids.settosel, this.get() ),
    UIH.clrel( this.ids.stat ),
    this.broadcastChg( 'sel' );
  return redraw;
}

UIH.ListController.prototype.list_add = function( d ) {
  if (!d)
    d = this.get( this.ids.addfrom );
  if (d) {
    this.arr.push( d );
    this.select( this.arr.length-1, -1, true );
  }
}

UIH.ListController.prototype.list_del = function( i ) {
  if (this.onDel)
    if (!this.onDel( i ))
      return;
  this.arr.splice( i, 1 );
  if (this.selrow == i)
    this.selrow = -1, this.selcol = -1,
    this.sets( this.ids.settosel, this.get() );
  else
    if (i > this.selrow)
      this.selrow--;
  if (this.onDelOk)
    this.onDelOk( i );
  this.dataChanged();
}

UIH.ListController.prototype.list_clearData = function( ) {
  this.arr = [];
  this.selrow = this.selcol = -1;
  this.sets( this.ids.settosel, this.get() );
  this.dataChanged();
}

UIH.ListController.prototype.getCellId = function( row, col ) {
  return this.ids.list + '_' + row + '_' + col;
}

UIH.ListController.prototype.list_getColVal = function( 
                                      row, col, coldef, data ) {
  if (coldef.clkdel)
    return "";
  return data.toString();
}

UIH.ListController.prototype.list_getColCls = function( 
                                      row, col, coldef, data ) {
  if (row == this.selrow && coldef.selclass)
    return coldef.selclass;
  return coldef.class;
}

UIH.ListController.prototype.fmtCol = function( row, col, coldef, data ) {
  var listId = "'" + this.ids.list + "'";
  var hov = clk = "";
  if (coldef.act) {
    hov = ' onmouseover="UIH.list._onHover(' + 
                      row + ',' + col + ',' + listId + ');"';
    clk = ' onclick="UIH.list._onClk(' + 
                      row + ',' + col + ',' + listId + ');"';
  }
  var id = 'id=' + this.getCellId( row, col );
  var cls = this.getColCls( row, col, coldef, data );
  if (cls)
    cls = " class='" + cls + "'";
  var v = this.getColVal( row, col, coldef, data );
  if (coldef.edit)
    return "<input type='text' " + id + cls + " value='" + v + "'/>";
  var alt = "";
  if (this.getColAlt)
    alt = this.getColAlt( row, col, coldef, data );
  if (alt)
    alt = " title='" + alt + "'";
  if (coldef.clkdel)
    v = 'x';
  return "<span " + id + cls + clk + hov + alt + ">" + v + "</span>";
}

UIH.ListController.prototype.fmtRow = function( row, data ) {
  var r = "<div>";
  for( var i=0; i<this.coldefs.length; i++ )
    r += this.fmtCol( row, i, this.coldefs[i], data );
  return r + "</div>";
}

UIH.ListController.prototype.populate = function( newarr ) {
  var c = this;
  if (newarr)
    c.arr = newarr;
  function fc( d, i ) {
    return c.fmtRow( i, d );
  }
  UIH.populateList( this.ids.list, this.arr, fc );
}

UIH.ListController.prototype.list_refresh = function( ) {
  UIH.clrel( this.ids.stat );
  this.populate();
  this.sets( this.ids.settosel, this.get() );
}

UIH.ListController.prototype.reset = function( newarr ) {
  if (newarr)
    this.arr = newarr;
  this.dataChanged();
}
