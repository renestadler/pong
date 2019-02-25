let playerName: string = "Buguser";
let playerNameEnemy: string = null;
let gameName: string = "GameName";
let gameId: number;
let playerNum: number;
const socket = io();

socket.on("Games", function (games: any[]) {
    let html = "<table>";
    html += `<tr><th class="name">Game</th><th class="numPlayers">Player</th><th class="status">Status</th><th class="join">Join Game</th><th class="watch">Watch Game</th></tr>`;

    games.forEach(curGame => {
        if (curGame.status !== 2) {
            html += `<tr>`;
            html += `<td class="name">${curGame.name}</td>`;
            html += `<td class="numPlayers"><div class="player">${curGame.numPlayers}/2 <span class="tooltiptext">`;
            if (curGame.numPlayers === 2) {
                html += `<p>${curGame.p1Name}, ${curGame.p2Name}</p>`
            } else if (curGame.numPlayers === 1) {
                html += `<p>${curGame.p1Name}</p>`;
            }
            html += `</span></div></td>`;
            if (curGame.status === 0) {
                html += `<td class="status">lobby</td>`;
            } else if (curGame.status === 1) {
                html += `<td class="status">running</td>`;
            }
            if (curGame.numPlayers < 2 && curGame.status === 0) {
                html += `<td class="join"><button class="tableBtn" onclick="jGame(${curGame.id})">Join Game</button></td>`
            } else {
                html += `<td class="join"><button class="tableBtn" onclick="jGame(${curGame.id})" disabled>Join Game</button></td>`
            }
            html += `<td class="watch"><button class="tableBtn" onclick="wGame(${curGame.id})">Watch Game</button></td>`
            html += `</tr>`;
        }
    });
    html += "</table>";
    document.getElementById("activeGames").innerHTML = html;
});

socket.on("Create", function (id: number) {
    document.getElementById("lobby").style.display = "none";
    document.getElementById("registration").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("gameTitle").innerText = `Title: ${gameName}, Id: ${id}`;
    document.getElementById("pl1").innerText = `Player 1: ${playerName}`;
    gameId = id;
    playerNum = 1;
    (<HTMLInputElement>document.getElementById("pointsToWin")).value = 2 + "";
});

socket.on("Join", function (infos) {
    document.getElementById("lobby").style.display = "none";
    document.getElementById("registration").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("gameTitle").innerText = `Title: ${infos.gameName}, Id: ${infos.id}`;
    document.getElementById("pl1").innerText = `Player 1: ${infos.playerName}`;
    document.getElementById("pl2").innerText = `Player 2: ${playerName}`;
    playerNameEnemy = infos.playerName;
    gameId = infos.id;
    playerNum = 2;
});

socket.on("Watch", async function (infos) {
    playerNum = -1;
    if (infos.status === 0) { //Lobby
        document.getElementById("lobby").style.display = "none";
        document.getElementById("registration").style.display = "none";
        document.getElementById("game").style.display = "block";
        document.getElementById("gameTitle").innerText = `Title: ${infos.gameName}, Id: ${infos.id}`;
        document.getElementById("pl1").innerText = `Player 1: ${infos.playerName1}`;
        document.getElementById("pl2").innerText = `Player 2: ${infos.playerName2}`;
        gameId = infos.id;
    } else if (infos.status === 1) { //Running
        gameId = infos.id;
        await (<any>window.parent).start(playerNum, gameId);
    }
});

socket.on("JoinP2", function(newPlayer){
    document.getElementById("pl2").innerText = `Player 2: ${newPlayer}`;
    if (newPlayer !== playerName) {
        playerNameEnemy = newPlayer;
    }
});

socket.on("UpdatePTW", function (change) {
    (<HTMLInputElement>document.getElementById("pointsToWin")).value = change;
});

socket.on("UpdateDifficulty", function (change) {
    (<HTMLInputElement>document.getElementById("difficulty")).value = change;
});

socket.on("Start", function () {
    (<any>window.parent).start(playerNum, gameId);
});

//TODO: switch to client after game started

//the following TODOs are optional
//TODO: End a game if every player has left
//TODO: Add difficulty at server
//TODO: Automatically update gameslist in the lobby

function loadLobby() {
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

function cGame() {
    if ((<HTMLInputElement>document.getElementById("inputGameName")).value.length > 0) {
        gameName = (<HTMLInputElement>document.getElementById("inputGameName")).value;
        socket.emit("Create", { gameName: gameName, playerName: playerName });
    } else {
        window.alert("You need to type in a name");
    }
}

function jGame(id: number) {
    socket.emit("Join", { pName: playerName, gameId: id });
}

function wGame(id: number) {
    socket.emit("Watch", { pName: playerName, gameId: id });
}

function startGame() {
    if (playerNameEnemy !== null) {
        socket.emit("Start", gameId);
    } else {
        window.alert("You need 2 players to start");
    }
}

function loadGames() {
    socket.emit("Games");
}

function updatePTW() {
    socket.emit("UpdatePTW", { gameId: gameId, change: parseInt((<HTMLInputElement>document.getElementById("pointsToWin")).value) });

}

function updateDifficulty() {
    socket.emit("UpdateDifficulty", { gameId: gameId, change: parseInt((<HTMLInputElement>document.getElementById("difficulty")).value) });
}