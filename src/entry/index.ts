let playerNumber: number;

function start(playerNum: number){
    playerNumber = playerNum;
    (<any>document.getElementById("myFrame")).src="/../client/index.html";
}

function lobby(){
    (<any>document.getElementById("myFrame")).src="/../lobby/index.html";
}