let playerNumber: number;
let s: SocketIO.Socket;

function start(playerNum: number, socket:SocketIO.Socket){
    playerNumber = playerNum;
    s = socket;
    (<any>document.getElementById("myFrame")).src="/../client/index.html";
}

function lobby(){
    (<any>document.getElementById("myFrame")).src="/../lobby/index.html";
}