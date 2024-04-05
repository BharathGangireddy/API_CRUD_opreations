const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let database;
const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
  }
};
initializeDBAndServer();
/// GENERATE  JWT TOKEN

/// GET API
app.get("/states/", async (request, response) => {
  const getQuery = `select
   *  from 
    state`;
  const dbResponse = await database.all(getQuery);
  response.send(
    dbResponse.map((eachItem) => covertDBResponseToArray(eachItem))
  );
});

// GET API BASED ON ID

const covertDBResponseToArray = (dbResponse) => {
  return {
    stateId: dbResponse.state_id,
    stateName: dbResponse.state_name,
    population: dbResponse.population,
  };
};
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const dbResponse = await database.get(getQuery);

  response.send(covertDBResponseToArray(dbResponse));
});

//POST METHOD DISTRICT API

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertQuery = `
    INSERT INTO district(district_name, state_id, cases, cured, active, deaths) 
    VALUES(
       '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
        ${deaths}
    );
    `;
  const dbResponse = database.run(insertQuery);
  response.send("District Successfully Added");
});

///
covertDBResponseToArrayDistrict = (eachItem) => {
  return {
    districtId: eachItem.district_id,
    districtName: eachItem.district_name,
    stateId: eachItem.state_id,
    cases: eachItem.cases,
    cured: eachItem.cured,
    active: eachItem.active,
    deaths: eachItem.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `
  select * from district where district_id = ${districtId}`;
  const getResponse = await database.get(getQuery);
  response.send(
    covertDBResponseToArrayDistrict(getResponse)

    // getResponse.map((eachItem) => covertDBResponseToArrayDistrict(eachItem))
  );
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `delete from district where district_id = ${districtId}`;
  const dbResponse = await database.run(deleteQuery);
  response.send("District Removed");
});
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateQuery = `UPDATE district SET 
    district_name = '${districtName}', 
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured}, 
    active = ${active},
    deaths = ${deaths} WHERE district_id = ${districtId}
  `;
  const dbResponse = await database.run(updateQuery);
  response.send("District Details Updated");
});

///GET API STATS

app.get(
  "/states/:stateId/stats/",

  async (request, response) => {
    const { stateId } = request.params;
    const getQuery = `
    SELECT
      SUM(cases) AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM district
    WHERE state_id = ${stateId};
  `;
    const dbResponse = await database.get(getQuery);
    response.send(dbResponse);
  }
);

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district where district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state where state_id = ${getDistrictIdQueryResponse.state_id};
`;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
