let playerName: string = "Buguser";
const socket = io();

socket.on("Games", function(games:any[]){
    let html = "<table>";
    html += `<tr><th class="name">Game</th><th class="numPlayers">Player</th><th class="status">Status</th><th class="join">Join Game</th><th class="watch">Watch Game</th></tr>`;
    
    games.forEach(curGame => {
        html += `<tr>`;
        html += `<td class="name">${curGame.name}</td>`;
        html += `<td class="numPlayers"><div class="player">${curGame.numPlayers}/2 <span class="tooltiptext">`;
        if (curGame.numPlayers === 2){
            html += `<p>${curGame.p1Name}, ${curGame.p2Name}</p>`
        } else if (curGame.numPlayers === 1) {
            html += `<p>${curGame.p1Name}</p>`;
        }
        html+= `</span></div></td>`;
        html += `<td class="status">${curGame.status}</td>`;
        if (curGame.numPlayers < 2){
            html += `<td class="join"><button class="tableBtn" onclick="jGame(${curGame.id})">Join Game</button></td>`
        } else {
            html += `<td class="join"><button class="tableBtn" onclick="jGame(${curGame.id})" disabled>Join Game</button></td>` 
        }
        html += `<td class="watch"><button class="tableBtn" onclick="wGame(${curGame.id})">Watch Game</button></td>`
        html += `</tr>`;
    });
    html += "</table>";
    document.getElementById("activeGames").innerHTML = html;
});

function loadLobby(){
    if ((<HTMLInputElement>document.getElementById("playerName")).value.length > 0) {
        document.getElementById("lobby").style.display = "block";
        document.getElementById("registration").style.display = "none";
        playerName = (<HTMLInputElement>document.getElementById("playerName")).value;
        document.getElementById("pName").innerText = `Your name: ${playerName}`;
        loadGames();
    }
}

function loadRegistration() {
    document.getElementById("lobby").style.display = "none";
    document.getElementById("registration").style.display = "block";
}

function cGame(){
    (<any>window.parent).createGame(playerName);
}

function jGame(id: number){
    console.log(id);
    (<any>window.parent).joinGame(id, playerName);
}

function wGame(id: number){
    console.log(id);
    (<any>window.parent).watchGame(id, playerName);
}

function loadGames(){
    socket.emit("Games");
}