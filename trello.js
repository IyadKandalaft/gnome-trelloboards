const   
        Soup	= imports.gi.Soup;

/**
 * Trello API parent object that provides a convenience to instantiating 
 * other objects such as TrelloBoard, TrelloUser, or TrelloList
 * 
 * @param {string} user User identifier (email or username)
 * @param {string} apikey User's API key
 * @param {string} token  API access token
 */
var Trello = class {
    constructor(user, apikey, token){
        /** @cost {string} */
        this.TRELLOAPI = 'https://trello.com/1';

        this.session = new Soup.Session();
        Soup.Session.prototype.add_feature.call(this.session, new Soup.ProxyResolverDefault());

        this.uid = user;
        this.apikey = apikey;
        this.token = token;
    }

    /**
     * Sends an API query to an endpoint
     * This method is leveraged by all subclasses to query their endpoints
     *
     * @param {string} endpoint URL to the endpoint that will be queried
     * @returns {object} 
     */
    _sendMessage(endpoint){
        let message = Soup.Message.new('GET', this.TRELLOAPI + endpoint);

        let status = this.session.send_message(message);
        log(`message returned: ${status}`);
        if (status != 200){
            //throw("Invalid API key or token");
            log('ERROR!');
        }
        //log(`message results ${message.response_body.data}`)
        return JSON.parse(message.response_body.data);
    }

    boards(){
        return new TrelloBoards(this.uid, this.apikey, this.token);
    }

    user(){
        return new TrelloUser(this.uid, this.apikey, this.token);
    }
}

/**
 * Collection of TrelloList for a specific Trello Board
 * 
 * @param {string} user User identifier (email or username)
 * @param {string} apikey User's API key
 * @param {string} token  API access token
 * @param {string} boardId List's unique identifier
 */
var TrelloLists = class TrelloLists extends Trello {
    constructor(user, apikey, token, boardId){
        super(user, apikey, token);
        this.boardId = boardId;
        this.listIds = [];
        this.items = [];
        this.refresh();
    }

    /**
     * Refresh this object's information by querying the API endpoint
     */
    refresh(){
        let boardLists = this._sendMessage(`/boards/${this.boardId}/lists?token=${this.token}&key=${this.apikey}`);
        this.listIds = [];
        this.items = [];
        boardLists.forEach(list => {
            this.listIds.push(list.id);
            let trelloList = new TrelloList(this.uid, this.apikey, this.token, list.id, list); 
            this.items.push(trelloList);
        });
    }
}

/**
 * Trello List encapsulation object
 * 
 * @param {string} user User identifier (email or username)
 * @param {string} apikey User's API key
 * @param {string} token  API access token
 * @param {string} listId List's unique identifier
 * @param {object} info Optional parameter to set this list's info field without executing an API call
 */
var TrelloList = class TrelloBoard extends Trello {
    constructor(user, apikey, token, listId, info = {}){
        super(user, apikey, token);
        this.listId = listId;
        this.info = info;
        if ( Object.entries(info).length === 0 ){
            this.refresh();
        }
    }

    /**
     * Refresh this object's information by querying the API endpoint
     */
    refresh(){
        this.info = this._sendMessage(`/list/${this.listId}?token=${this.token}&key=${this.apikey}`);
    }
}

/**
 * Collection of TrelloBoard that the user belongs to
 * 
 * @param {string} user User identifier (email or username)
 * @param {string} apikey User's API key
 * @param {string} token  API access token
 */
var TrelloBoards = class TrelloBoards extends Trello {
    constructor(user, apikey, token){
        super(user, apikey, token);
        this.boardIds = [];
        this.items = [];
        this.refresh();
    }

    refresh(){
        this.boardIds = this._sendMessage(`/members/${encodeURI(this.uid)}?token=${this.token}&key=${this.apikey}`).idBoards;
        this.items = [];
        this.boardIds.forEach(board => {
            this.items.push(new TrelloBoard(this.uid, this.apikey, this.token, board));
        });
    }
}

/**
 * Trello Board encapsulation object
 * 
 * @param {string} user User identifier (email or username)
 * @param {string} apikey User's API key
 * @param {string} token  API access token
 * @param {string} boardId Board's unique identifier
 */
var TrelloBoard = class TrelloBoard extends Trello {
    constructor(user, apikey, token, boardId){
        super(user, apikey, token);
        this.boardId = boardId;
        this.info = {};
        this.refresh();
    }

    /**
     * Refresh this object's information by querying the API endpoint
     */
    refresh(){
        this.info = this._sendMessage(`/boards/${this.boardId}?token=${this.token}&key=${this.apikey}`);
    }

    /**
     * Get a the lists within this Trello Board
     * 
     * @returns {TrelloLists} collection of Trello Lists
     */
    lists(){
        return new TrelloLists(this.user, this.apikey, this.token, this.boardId);
    }
}

/**
 * Trello User encapsulation object
 * 
 * @param {string} user User identifier (email or username)
 * @param {string} apikey User's API key
 * @param {string} token  API access token
 */
var TrelloUser = class TrelloUser extends Trello {
    constructor(user, apikey, token){
        super(user, apikey, token);
        this.info = {};
        this.refresh();
    }

    /**
     * Refresh this object's information by querying the API endpoint
     */
    refresh(){
        this.info = this._sendMessage(`/tokens/${this.token}/member?key=${this.apikey}`);
    }
}