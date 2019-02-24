let playerName: string = "Buguser";

function loadLobby(){
    if ((<HTMLInputElement>document.getElementById("playerName")).value.length > 0) {
        document.getElementById("lobby").style.display = "block";
        document.getElementById("registration").style.display = "none";
        playerName = (<HTMLInputElement>document.getElementById("playerName")).value;
        loadGames();
    }
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

function refreshGames(){
    //TODO: Delete current list
    loadGames();
}

function loadGames(){
    //TODO: Load the list with socket.io and create the html elements
    let games = getGames();
    
    document.getElementById("pName").innerText = `Your name: ${playerName}!`;
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
}

function getGames(){
    let ar = new Array();
    ar.push({name: "test", id: 1, numPlayers: 2, status: "playing", p1Name: "Stalder", p2Name: "Test"});
    ar.push({name: "hallo", id: 2, numPlayers: 1, status: "lobby", p1Name: "Brych", p2Name: ""});
    return ar;
}