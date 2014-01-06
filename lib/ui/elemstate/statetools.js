//
//statetools.js (UI Tools, extension of Element State Library)
//  public domain,
//  requires transev.js (transition events),
//           elemstate.js (element state library)
//
//Some UI tools for toggling and controlling focus using the 
//state model provided by elemstate.js (see there for doc).
//
//WIDGET TOOL (ESMWidgetTool)
//
//  Attributes:
//    ESMFocusId = <id>
//      When first clicked, focus will be set to 'id' (child),
//        most recently focused child will receive focus after
//
//  State added:
//    'childfocused', set in parent node(s); indicates a widget 
//      child has the focus (which can be used to gray the 
//      element for example)
//
//TOGGLE TOOL (ESMToggleTool)
//  typically a button (toggler) and popup (target),
//    target must be of type ESMWidgetTool
//
//  Attributes:
//    ESMToggleTarget = <id>  (required)
//      <id>: elem to target with new states (eg, popup)
//    ESMDeactivateId = <id>
//      All states in target cleared when 'id' clicked 
//       (eg, close button, in target)
//
//  States added to target:
//    'togglerhover', hover on toggler
//    'toggled', alternating clicks on toggler set/clear (also 
//       set in toggler)
//    'suggested', hover on toggler only (no other toggle tools
//       in same level have 'toggled' state set)
//
//
ESM.registerStates( [
  "childfocused",
  "suggested",
  "toggled",
  "togglerhover"
] );
ESM.attributeClasses[ESM.attributeClasses.length] = {
  name:"focusid",jsclass:"ESMWidgetTool"}
ESM.attributeClasses[ESM.attributeClasses.length] = {
  name:"toggletarget",jsclass:"ESMToggleTool"}


/*
 * Widget (inherits from ESMElem)
 */
function ESMWidgetTool( ) {

  this.widgetTool_setParentState = function( state, enable ) {
    var p = ESM.findParentElem( this.elem.parentNode );
    p = ESM.getElemObj( p );
    if (p && state) {
      if (state.substr(0,5) != 'child')
        state = 'child' + state;
      if (state == 'childfocused')
        ESM.setState( p.elem, state, enable );
    }
  }
  this.widgetTool_restoreFocus = function( TEMe ) {
    if (this.def.attributes.focusid) {
      /*(set focus if not already set somewhere below)*/
      if (!TEM.isParentOf( this.elem, document.activeElement )) {
        var fe = this.focusedElem;
        if (fe && fe.disabled)
          fe = null;
        if (!fe)
          fe = document.getElementById( this.def.attributes.focusid );
        if (fe && !fe.disabled && fe != document.activeElement)
          fe.focus();
      }
    }
  }
  this.widgetTool_saveFocus = function() {
    if (this.def.attributes.focusid && TEM.getSystemFocus()) {
      var match = function( elem ) {
        var t = ESM.getElemObj( elem );
        return t && t.def.attributes.focusid;
      }
      /*(save focus if no child tool is handling it)*/
      if (TEM.findParent( TEM.getSystemFocus(), match ) == this.elem) {
        var sf = TEM.getSystemFocus();
        if (!(TEM.getElem(sf) instanceof HTMLButtonElement))
          this.focusedElem = sf;
      }
    }
  }
  this.widgetTool_setState = function( state, enable ) {
    if (state == 'focused' && enable)
      this.saveFocus();
    var alreadytoggled = this.state && this.state.enabled( 'toggled' );
    this.elem_setState( state, enable );
    if (enable)
      if (state == 'toggled')
        if (enable && !alreadytoggled)
          this.restoreFocus();
    this.setParentState( state, enable );
  }
  this.widgetTool_init = function( def ) {
    this.elem_init( def );
  }
  /*override*/
  this.init = this.widgetTool_init;
  this.setState = this.widgetTool_setState;
  /*widget methods*/
  this.saveFocus = this.widgetTool_saveFocus;
  this.restoreFocus = this.widgetTool_restoreFocus;
  this.setParentState = this.widgetTool_setParentState;
}
ESMWidgetTool.prototype = new ESMElem();


/*
 * Toggle (inherits from ESMElem)
 */
ESM.toggleTools = [];
function ESMToggleTool( ) {

  this.toggleTool_grayDeactivateId = function() {
    var t = ESM.getElemObj( this.def.attributes.toggletarget );
    if (!t || !this.def.attributes.deactivateid)
      return;
    var de = document.getElementById( this.def.attributes.deactivateid );
    if (de)
      de.disabled = !t.state.enabled( 'toggled' );
  }
  this.toggleTool_clickedDeactivateId = function( ) {
    if (!this.def.attributes.deactivateid)
      return;
    var de = document.getElementById( this.def.attributes.deactivateid );
    if (de && !de.disabled)
      return ESM.isEventInside( this.elem, de );
    return false;
  }
  this.toggleTool_isInTarget = function( ) {
    var targ = this.def.attributes.toggletarget;
    return ESM.isEventInside( this.elem, targ );
  }
  this.toggleTool_isAnotherToggled = function( ) {
    for( var i=0; i<ESM.toggleTools.length; i++ )
      if (ESM.toggleTools[i] != this)
        if (ESM.toggleTools[i].state.enabled('toggled')) {
          var ts = ESM.toggleTools;
          var par = ESM.getElemObj( ts[i].def.attributes.toggletarget );
          if (par)
            if (!TEM.isParentOf( par.elem, this.elem ))
              return true;
        }
    return false;
  }
  this.toggleTool_setToggleState_ = function( enable ) {
    var targ = this.def.attributes.toggletarget;
    var t = ESM.getElemObj( targ );
    if (t) {
      t.setState( 'toggled', enable );
      if (!enable)
        t.setState();
    }
    return enable;
  }
  this.toggleTool_setToggleState = function( enable ) {
    this.setState( 'toggled', enable );
    return enable;
  }
  this.toggleTool_toggle = function( enable ) {
    if (!enable && this.clickedDeactivateId()) {
      enable = false;
      this.elem.focus();
    }
    else
      if (enable) {
        if (this.state.enabled( 'toggled' ))
          enable = false;
      }
      else
        if (this.toggleTool_isInTarget())
          enable = true;
    this.setToggleState( enable );
  }
  this.toggleTool_focus = function( enable ) {
    if (enable) {
      //TODO: toggle off if focus-only, not assoc w/clk
    }
    else {
      if (this.toggleTool_isInTarget())
        enable = true;
      if (!ESM.isEventInside( this.elem, 
                              this.def.attributes.deactivateid ))
        this.setToggleState( enable );
    }
  }
  this.toggleTool_hover = function( enable ) {
    var targ = this.def.attributes.toggletarget;
    var t = ESM.getElemObj( targ );
    if (t) {
      t.setState( 'togglerhover', enable );
      if (this.toggleTool_isAnotherToggled())
        enable = false;
      t.setState( 'suggested', enable );
    }
  }
  this.toggleTool_setState = function( state, enable ) {
    //this.widgetTool_setState( state, enable );
    this.elem_setState( state, enable );
    if (state == 'clicked')
      this.toggle( enable );
    else
      if (state == 'focused')
        this.toggleTool_focus( enable );
      else
        if (state == 'hover')
          this.toggleTool_hover( enable );
        else
          if (state == 'toggled')
            this.toggleTool_setToggleState_( enable );
    this.grayDeactivateId();
  }
  this.toggleTool_init = function( def ) {
    //this.widgetTool_init( def );
    this.elem_init( def );
    ESM.toggleTools.push( this );
  }
  /*override*/
  this.init = this.toggleTool_init;
  this.setState = this.toggleTool_setState;
  /**/
  this.setToggleState = this.toggleTool_setToggleState;
  this.toggle = this.toggleTool_toggle;
  this.clickedDeactivateId = this.toggleTool_clickedDeactivateId;
  this.grayDeactivateId = this.toggleTool_grayDeactivateId;
}
//ESMToggleTool.prototype = new ESMWidgetTool();
ESMToggleTool.prototype = new ESMElem();


