const   
        Soup	= imports.gi.Soup;

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

var TrelloBoard = class TrelloBoard extends Trello {
    constructor(user, apikey, token, boardId){
        super(user, apikey, token);
        this.boardId = boardId;
        this.info = {};
        this.refresh();
    }

    refresh(){
        this.info = this._sendMessage(`/boards/${this.boardId}?token=${this.token}&key=${this.apikey}`);
    }
}

var TrelloUser = class TrelloUser extends Trello {
    constructor(user, apikey, token){
        super(user, apikey, token);
        this.info = {};
        this.refresh();
    }

    refresh(){
        this.info = this._sendMessage(`/tokens/${this.token}/member?key=${this.apikey}`);
    }
}