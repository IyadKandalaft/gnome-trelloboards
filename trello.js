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
     * @returns {object} Response JSON parsed into an object
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
var TrelloList = class TrelloList extends Trello {
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
        this.info = this._sendMessage(`/lists/${this.listId}?token=${this.token}&key=${this.apikey}`);
    }

    cards(){
        return new TrelloCards(this.user, this.apikey, this.token, { listId: this.listId });
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

    /**
     * Refresh this object's information by querying the API endpoint
     */
    refresh(){
        this.boardIds = this._sendMessage(`/members/${encodeURI(this.uid)}?token=${this.token}&key=${this.apikey}`).idBoards;
        this.items = [];
        this.boardIds.forEach(boardId => {
            this.items.push(new TrelloBoard(this.uid, this.apikey, this.token, boardId));
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
     * Get the lists within this Trello Board
     * 
     * @returns {TrelloLists} collection of Trello Lists
     */
    lists(){
        return new TrelloLists(this.user, this.apikey, this.token, this.boardId);
    }

    /**
     * Get the cards within this Trello Board
     * 
     * @returns {TrelloCards} collection of Trello Cards
     */
    cards(){
        return new TrelloCards(this.user, this.apikey, this.token, { boardId: this.boardId });
    }
}

/**
 * Collection of TrelloCard for a specific Trello Board
 * 
 * @param {string} user User identifier (email or username)
 * @param {string} apikey User's API key
 * @param {string} token  API access token
 * @param {string} boardId Parent Trello Board's unique identifier
 * @param {string} listId Parent Trello List's unique identifier
 */

var TrelloCards = class TrelloCards extends Trello {
    constructor(user, apikey, token, { 
            boardId = null,
            listId = null
        } = {}){
        super(user, apikey, token);
        this.boardId = boardId;
        this.listId = listId;
        this.cardIds = [];
        this.items = [];
        this.refresh();
    }

    /**
     * Refresh this object's information by querying the API endpoint
     */
    refresh(){
        // Get cards in a list even if both boardId and listId are provided
        let cards = [];
        if ( this.listId !== null ){
            log(`Fetching cards for list ${this.listId}`);
            cards = this._sendMessage(`/lists/${this.listId}/cards?token=${this.token}&key=${this.apikey}`);
        } else {
            log(`Fetching cards for board ${this.boardId}`);
            cards = this._sendMessage(`/boards/${this.boardId}/cards?token=${this.token}&key=${this.apikey}`);
        }
        
        // Populate cardIds and create TrelloCard objects for each card found
        this.cardIds = [];
        this.items = [];
        cards.forEach(card => {
            this.cardIds.push(card.id);
            let trelloCard = new TrelloCard(this.uid, this.apikey, this.token, card.id, card); 
            this.items.push(trelloCard);
        });
    }
}

/**
 * Trello Card encapsulation object
 * 
 * @param {string} user User identifier (email or username)
 * @param {string} apikey User's API key
 * @param {string} token  API access token
 * @param {string} cardId Card's unique identifier
 * @param {object} info Optional parameter to set this card's info field without executing an API call
 */
var TrelloCard = class TrelloCard extends Trello {
    constructor(user, apikey, token, cardId, info = {}){
        super(user, apikey, token);
        this.cardId = cardId;
        this.info = info;
        if ( Object.entries(info).length === 0 ){
            this.refresh();
        }
    }

    /**
     * Refresh this object's information by querying the API endpoint
     */
    refresh(){
        this.info = this._sendMessage(`/cards/${this.cardId}?token=${this.token}&key=${this.apikey}`);
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