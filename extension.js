
const	
		PanelMenu = imports.ui.panelMenu;
		St      = imports.gi.St,
		Gio     = imports.gi.Gio,
		Main  	= imports.ui.main,
		GObject = imports.gi.GObject,
		Meta  	= imports.gi.Meta,
		Shell   = imports.gi.Shell,
		Config  = imports.misc.config,
		DateTime	= imports.gi.GLib.DateTime,
		ExtensionUtils = imports.misc.extensionUtils,
		Me          = ExtensionUtils.getCurrentExtension();

const	Trello	= Me.imports.trello;


var user="iyadkandalaft1",
	apikey="cc6e37f8ff4a15dea4a5346003bc0528",
	token="d546c3d058a48034288e701bdde7d8f923818963557e2c23771ff53fc0f5fc96";
	
//const	SUI            = Local.imports.switcherUI,
//		Utils          = Local.imports.utils;

//const MessageTray = imports.ui.messageTray;

let _extension;

const TrelloBoardsExt = GObject.registerClass(
	{
		GTypeName: 'TrelloBoards'
	},
	class TrelloBoards extends PanelMenu.Button {

	/**
	 * _init:
	 *
	 * Initialize the new instance of DisplayExtension, load translations, theme, 
	 * settings, bind and then point to on keyPress SwitcherManager.
	 */
	_init() 
	{
		var trello = new Trello.Trello(user, apikey, token);
		logm('Signed in user: ' + trello.user().info.aaEmail);
		logm('User is a member of boards: ' + trello.boards().boardIds);
		var button = new PanelMenu.Button();
		let label = new St.Label({text: "Trello"});
		button.add_actor(label);
		//button.actor.connect('button-press-event', _showMenu);
		Main.panel.addToStatusArea('services', button);
	}

	/**
	 * _destroy:
	 *
	 * Un-Initialize everything, destroy the necessary references and principal unbind 
	 * the keybind shorcut.
	 */	
	_destroy()
	{
		logm('Called DisplayExtension.destroy');
	}
});

/**
 *	Required methods for a gnome-shell extension.
 */
function init() 
{
	logm('Initializing extension');
}

function enable() 
{
	logm('Enabling extension');
	_extension = new TrelloBoardsExt();
}

function disable()
{
	logm('Disabling extension');

	if( _extension ) {
		_extension._destroy();
		_extension = null;
	}
}

function logm(message){
	var now = DateTime.new_now_local().format('%Y-%m-%d %H:%M:%S');
	
	log(`!!!!!!!!!!!!!!!! ${now} - Trello-Boards - ${message} !!!!!!!!!!!!!`);
}
