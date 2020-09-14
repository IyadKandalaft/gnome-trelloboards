
const	
		PanelMenu = imports.ui.panelMenu,
		PopupMenu = imports.ui.popupMenu,
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

var _extension;

const TrelloBoardsExt = GObject.registerClass(
	{
		GTypeName: 'TrelloBoards'
	},
	class TrelloBoards extends PanelMenu.Button  {

	/**
	 * _init:
	 *
	 * Initialize the new instance of DisplayExtension, load translations, theme, 
	 * settings, bind and then point to on keyPress SwitcherManager.
	 */
	_init() 
	{
		logm("WTF!");
		
		super._init(0.0);

		let label = new St.Label({
			text: 'Trello',
			'y-align': 2
		});
		this.add_child(label);

		Main.panel.addToStatusArea('services', this);
			
		this._populate_menu();
		
	}

	async _populate_menu(){
		this.trello = new Trello.Trello(user, apikey, token);
		logm('Signed in user: ' + this.trello.user().info.aaEmail);
		//logm('User is a member of boards: ' + trello.boards().boardIds);
		for (const trelloBoard of this.trello.boards().items) {
			let subMenu = new PopupMenu.PopupSubMenuMenuItem(trelloBoard.info.name);
			//Main.notify(trelloBoard.info.desc)
			subMenu.connect('button-press-event', function(){  });
			this.menu.addMenuItem(subMenu);
			
			for (const trelloList of trelloBoard.lists().items) {
				let listMenuItem = new PopupMenu.PopupMenuItem(trelloList.info.name);
				let menuSeparator = new PopupMenu.PopupSeparatorMenuItem();
				subMenu.menu.addMenuItem(listMenuItem);
				subMenu.menu.addMenuItem(menuSeparator);

				let trelloCards = trelloList.cards();
				for (const trelloCard of trelloCards.items) {
					let cardTitle = trelloCard.info.name.substring(0, 59);
					let cardMenuItem = new PopupMenu.PopupMenuItem(cardTitle);
					subMenu.menu.addMenuItem(cardMenuItem);
				}
			}
		}
	}

	/**
	 * _destroy:
	 *
	 * Un-Initialize everything, destroy the necessary references and principal unbind 
	 * the keybind shorcut.
	 */	
	_destroy()
	{
		this.destroy();
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

	if( _extension !== null ) {
		_extension._destroy();
		_extension = null;
	}
}

function logm(message){
	var now = DateTime.new_now_local().format('%Y-%m-%d %H:%M:%S');
	
	log(`!!!!!!!!!!!!!!!! ${now} - Trello-Boards - ${message} !!!!!!!!!!!!!`);
}
