
async function start(playerNum: number, gameId:number){
    (<any>document.getElementById("myFrame")).src="/../client/index.html";
    await d(1000);
    (<any>document.getElementById("myFrame")).contentWindow.setPlayer(playerNum,gameId);
}

function lobby(){
    (<any>document.getElementById("myFrame")).src="/../lobby/index.html";
}

function d(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}