import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";

const allowedExtensions = ["csv"];

const columns = [
  {
    field: "firstEmployee",
    headerName: "Employee ID #1",
    width: 150,
  },
  {
    field: "secondEmployee",
    headerName: "Employee ID #2",
    width: 150,
  },
  {
    field: "projectId",
    headerName: "Project ID",
    width: 100,
  },
  {
    field: "daysWorked",
    headerName: "Days worked",
    width: 100,
  },
];

const App = () => {
  const [error, setError] = useState("");
  const [file, setFile] = useState("");
  const [projectList, setProjectList] = useState([]);

  useEffect(() => {
    if (!file) return setError("Enter a valid file");

    const reader = new FileReader();
    reader.onload = async ({ target }) => {
      const csv = Papa.parse(target.result, {
        header: true,
      });

      const parsedData = csv.data;
      const list = new Map();
      for (let data of parsedData) {
        const startDate = new Date(data.DateFrom);
        const endDate = isNaN(new Date(data.DateTo))
          ? new Date()
          : new Date(data.DateTo);

        if (!list.has(data.ProjectID)) {
          list.set(data.ProjectID, {
            employees: [
              {
                empId: data.EmpID,
                startDate,
                endDate,
              },
            ],
          });
        } else {
          list.get(data.ProjectID).employees.push({
            empId: data.EmpID,
            startDate,
            endDate,
          });
        }
      }

      const result = [];
      for (let [projectId, { employees }] of list) {
        const currentPair = {
          projectId,
          data: { firstEmployee: 0, secondEmployee: 0, daysWorked: 0 },
        };
        for (let i = 0; i < employees.length; i++) {
          const curEmployee = employees[i];

          for (let j = i + 1; j < employees.length; j++) {
            const nextEmployee = employees[j];
            const daysWorked = getOverlappingRange(
              curEmployee.startDate,
              curEmployee.endDate,
              nextEmployee.startDate,
              nextEmployee.endDate
            );

            if (daysWorked > currentPair.data.daysWorked) {
              currentPair.data = {
                firstEmployee: curEmployee.empId,
                secondEmployee: nextEmployee.empId,
                daysWorked,
              };
            }
          }
        }
        if (currentPair) {
          result.push({
            id: currentPair.projectId,
            projectId: currentPair.projectId,
            ...currentPair.data,
          });
        }
      }
      if (result) {
        setProjectList(result);
      }
    };

    const getOverlappingRange = (
      startDate1,
      endDate1,
      startDate2,
      endDate2
    ) => {
      const start = startDate1 < startDate2 ? startDate2 : startDate1;
      const end = endDate1 < endDate2 ? endDate1 : endDate2;

      if (end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }

      return 0;
    };
    reader.readAsText(file);
  }, [file]);

  const handleFileChange = (e) => {
    setError("");

    if (e.target.files.length) {
      const inputFile = e.target.files[0];

      const fileExtension = inputFile.type.split("/")[1];
      if (!allowedExtensions.includes(fileExtension)) {
        setError("Please input a csv file");
        return;
      }

      setFile(inputFile);
    }
  };

  const cleanUp = () => {
    setProjectList([]);
    setFile(null);
    setError("");
    document.getElementById("csvInput").value = null;
  };

  return (
    <Box
      sx={{
        height: 400,
        width: "40%",
        margin: "auto",
      }}
    >
      <label
        htmlFor="csvInput"
        style={{
          display: "block",
        }}
      >
        Enter CSV File
      </label>
      <input
        onChange={handleFileChange}
        id="csvInput"
        name="file"
        type="File"
      />
      <button onClick={cleanUp}>Clear</button>
      <div
        style={{
          marginTop: "3rem",
        }}
      >
        {error ? error : null}
      </div>

      <DataGrid
        rows={projectList}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        disableSelectionOnClick
        experimentalFeatures={{
          newEditingApi: true,
        }}
      />
    </Box>
  );
};

export default App;
