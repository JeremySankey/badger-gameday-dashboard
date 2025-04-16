const teamIds = {
  "Wisconsin": 275,
  "Ohio State": 194,
  "Michigan": 130,
  "Penn State": 213,
  "Iowa": 2294,
  "Minnesota": 135,
  "Michigan State": 127,
  "Nebraska": 158,
  "Illinois": 356,
  "Indiana": 84,
  "Purdue": 2509,
  "Maryland": 120,
  "Rutgers": 164,
  "Northwestern": 77,
  "Alabama": 333,
  "Georgia": 61,
  "Florida": 57,
  "LSU": 99,
  "Texas": 251,
  "USC": 30,
  "Oregon": 2483,
  "Washington": 264
};

function getTeamLogo(teamName) {
  const id = teamIds[teamName];
  return id
    ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`
    : "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
}

async function fetchGames(sport) {
  try {
    const [res2024, res2025] = await Promise.all([
      fetch(`http://localhost:3000/api/schedule?year=2024&sport=${sport}`),
      fetch(`http://localhost:3000/api/schedule?year=2025&sport=${sport}`),
    ]);
    const games2024 = await res2024.json();
    const games2025 = await res2025.json();
    return [...games2024, ...games2025];
  } catch (error) {
    console.error(`Error fetching ${sport} games:`, error);
    return [];
  }
}

function displayScheduleAndScores(games, containerId, label) {
  const section = document.getElementById(containerId);
  section.innerHTML = `<h2>${label} Schedule & Scores</h2>`;

  const pastGames = games
    .filter(g => g.home_points !== null && g.away_points !== null)
    .sort((a, b) => new Date(b.date || b.start_date) - new Date(a.date || a.start_date))
    .slice(0, 3);

  const upcomingGames = games
    .filter(g => g.home_points === null && g.away_points === null)
    .sort((a, b) => new Date(a.date || a.start_date) - new Date(b.date || b.start_date))
    .slice(0, 2);

  const pastHeader = document.createElement("h3");
  pastHeader.textContent = "Previous Games";
  section.appendChild(pastHeader);

  pastGames.forEach((game) => {
    const home = game.home_team || "Home";
    const away = game.away_team || "Away";
    const homePoints = game.home_points ?? "-";
    const awayPoints = game.away_points ?? "-";
    const date = new Date(game.date || game.start_date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.alignItems = "center";
    div.style.gap = "1rem";
    div.style.padding = "4px 0";

    const dateDiv = document.createElement("div");
    dateDiv.style.flex = "1";
    dateDiv.textContent = date;

    const matchupDiv = document.createElement("div");
    matchupDiv.style.flex = "3";
    matchupDiv.innerHTML = `
      <img src="${getTeamLogo(away)}" alt="${away}" width="20"> ${away} @ 
      <img src="${getTeamLogo(home)}" alt="${home}" width="20"> ${home}
    `;

    const scoreDiv = document.createElement("div");
    scoreDiv.style.flex = "1";
    scoreDiv.style.textAlign = "right";
    scoreDiv.style.fontWeight = "bold";
    scoreDiv.textContent = `${awayPoints} : ${homePoints}`;

    div.appendChild(dateDiv);
    div.appendChild(matchupDiv);
    div.appendChild(scoreDiv);

    section.appendChild(div);
  });

  const nextHeader = document.createElement("h3");
  nextHeader.textContent = "Upcoming Games";
  section.appendChild(nextHeader);

  if (upcomingGames.length === 0) {
    section.innerHTML += "<div>TBD</div>";
  } else {
    upcomingGames.forEach((game) => {
      const home = game.home_team || "Home";
      const away = game.away_team || "Away";
      const date = new Date(game.date || game.start_date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.style.gap = "1rem";
      div.style.padding = "4px 0";

      const dateDiv = document.createElement("div");
      dateDiv.style.flex = "1";
      dateDiv.textContent = date;

      const matchupDiv = document.createElement("div");
      matchupDiv.style.flex = "3";
      matchupDiv.innerHTML = `
        <img src="${getTeamLogo(away)}" alt="${away}" width="20"> ${away} @ 
        <img src="${getTeamLogo(home)}" alt="${home}" width="20"> ${home}
      `;

      const scoreDiv = document.createElement("div");
      scoreDiv.style.flex = "1";
      scoreDiv.style.textAlign = "right";
      scoreDiv.style.color = "#888";
      scoreDiv.textContent = "- : -";

      div.appendChild(dateDiv);
      div.appendChild(matchupDiv);
      div.appendChild(scoreDiv);

      section.appendChild(div);
    });
  }
}

async function getBasketballSchedule() {
  try {
    const response = await fetch("http://localhost:3000/api/basketball");
    const events = await response.json();

    const pastGames = events
      .filter(e => e.competitions[0].status.type.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    const upcomingGames = events
      .filter(e => !e.competitions[0].status.type.completed)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 2);

    const section = document.getElementById("basketball-schedule");
    section.innerHTML = "<h2>Basketball Schedule & Scores</h2>";

    const pastHeader = document.createElement("h3");
    pastHeader.textContent = "Previous Games";
    section.appendChild(pastHeader);

    pastGames.forEach(game => {
      const comp = game.competitions[0];
      const home = comp.competitors.find(t => t.homeAway === "home");
      const away = comp.competitors.find(t => t.homeAway === "away");

      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.style.gap = "1rem";
      div.style.padding = "4px 0";

      const date = new Date(game.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      const homeScore = home.score?.displayValue ?? "-";
      const awayScore = away.score?.displayValue ?? "-";

      const dateDiv = document.createElement("div");
      dateDiv.style.flex = "1";
      dateDiv.textContent = date;

      const matchupDiv = document.createElement("div");
      matchupDiv.style.flex = "3";
      matchupDiv.innerHTML = `
        <img src="${getTeamLogo(away.team.shortDisplayName)}" width="20"> ${away.team.shortDisplayName} @ 
        <img src="${getTeamLogo(home.team.shortDisplayName)}" width="20"> ${home.team.shortDisplayName}
      `;

      const scoreDiv = document.createElement("div");
      scoreDiv.style.flex = "1";
      scoreDiv.style.textAlign = "right";
      scoreDiv.style.fontWeight = "bold";
      scoreDiv.textContent = `${awayScore} : ${homeScore}`;

      div.appendChild(dateDiv);
      div.appendChild(matchupDiv);
      div.appendChild(scoreDiv);

      section.appendChild(div);
    });

    const nextHeader = document.createElement("h3");
    nextHeader.textContent = "Upcoming Games";
    section.appendChild(nextHeader);

    if (upcomingGames.length === 0) {
      section.innerHTML += "<div>TBD</div>";
    } else {
      upcomingGames.forEach(game => {
        const comp = game.competitions[0];
        const home = comp.competitors.find(t => t.homeAway === "home");
        const away = comp.competitors.find(t => t.homeAway === "away");

        const div = document.createElement("div");
        const date = new Date(game.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric"
        });

        div.innerHTML = `
          ${date} — 
          <img src="${getTeamLogo(away.team.shortDisplayName)}" width="20"> ${away.team.shortDisplayName} @ 
          <img src="${getTeamLogo(home.team.shortDisplayName)}" width="20"> ${home.team.shortDisplayName}
        `;

        section.appendChild(div);
      });
    }
  } catch (error) {
    console.error("Error loading basketball schedule:", error);
  }
}

async function getNews() {
  try {
    const response = await fetch("http://localhost:3000/api/news");
    const articles = await response.json();

    const badgerExtraContainer = document.getElementById("badgerextra-news");
    const buckysContainer = document.getElementById("buckys-news");

    const grouped = {};
    articles.forEach(article => {
      if (!grouped[article.source]) {
        grouped[article.source] = [];
      }
      grouped[article.source].push(article);
    });

    console.log(`Bucky's 5th Quarter article count:`, grouped["Bucky's 5th Quarter"]?.length);

    Object.keys(grouped).forEach(source => {
      let container;
      let displayName = source;

      // ✅ Match exact known sources
      if (source === "BadgerExtra") {
        container = badgerExtraContainer;
        displayName = "BadgerExtra.com News";
      }
       else if (source === "Bucky's 5th Quarter") {
        container = buckysContainer;
        displayName = "Bucky's 5th Quarter";
      } else {
        console.warn(`Unknown source: '${source}' — skipping`);
        return;
      }

      const header = document.createElement("h3");
      header.textContent = displayName;
      container.appendChild(header);

      grouped[source]
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)) // sort by most recent first
      .slice(0, 5) // take only the first 5
      .forEach(article => {
        const div = document.createElement("div");
        const date = new Date(article.pubDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
    
        div.innerHTML = `
          <p><strong><a href="${article.link}" target="_blank">${article.title}</a></strong></p>
          <p style="color: #888;">${date}</p>
          <hr/>
        `;
    
        container.appendChild(div);
      });
    });

  } catch (error) {
    console.error("Error loading news:", error);
  }
}





async function loadDashboard() {
  const footballGames = await fetchGames("football");
  displayScheduleAndScores(footballGames, "football-schedule", "Football");
  await getBasketballSchedule();
  await getNews();
}

loadDashboard();
