let playerName: string = "Buguser";
let gameName: string = "GameName";
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

socket.on("Create", function(id: number){
    document.getElementById("lobby").style.display = "none";
    document.getElementById("registration").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("gameTitle").innerText = `Title: ${gameName}, Id: ${id}`;
    document.getElementById("pl1").innerText = `Player 1: ${playerName}`;
});

socket.on("Join", function(infos){
    document.getElementById("lobby").style.display = "none";
    document.getElementById("registration").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("gameTitle").innerText = `Title: ${infos.gameName}, Id: ${infos.id}`;
    document.getElementById("pl1").innerText = `Player 1: ${infos.playerName}`;
    document.getElementById("pl2").innerText = `Player 2: ${playerName}`;
});

socket.on("Watch", function(infos){
    document.getElementById("lobby").style.display = "none";
    document.getElementById("registration").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("gameTitle").innerText = `Title: ${infos.gameName}, Id: ${infos.id}`;
    document.getElementById("pl1").innerText = `Player 1: ${infos.playerName1}`;
    document.getElementById("pl2").innerText = `Player 2: ${infos.playerName2}`;
});

socket.on("Start", function(){
});

//TODO: Call the server to start the game
//TODO: switch to client after game started
//TODO: Join/Watch check status --> if running start client
//TODO: check if a player joined to your game
//TODO: Go back to lobby after game has ended
//TODO: Don't show games that have ended
//TODO: Change the status-numbers to actual strings
//TODO: End a game if every player has left

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
    if ((<HTMLInputElement>document.getElementById("inputGameName")).value.length > 0) {
        gameName = (<HTMLInputElement>document.getElementById("inputGameName")).value;
        socket.emit("Create", {gameName: gameName, playerName: playerName});
    }
}

function jGame(id: number){
    socket.emit("Join", {pName: playerName, gameId: id});
}

function wGame(id: number){
    socket.emit("Watch", {pName: playerName, gameId: id});
}

function startGame(){
    let pointsToWin = (<HTMLInputElement>document.getElementById("pointsToWin")).value;
    let difficulty = (<HTMLInputElement>document.getElementById("difficulty")).value;
}

function loadGames(){
    socket.emit("Games");
}