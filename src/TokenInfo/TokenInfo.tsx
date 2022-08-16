// Import FirebaseAuth and firebase.
import React, { useEffect, useState } from 'react';
import { Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement
  } from 'chart.js';
  
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
/*
<TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
       <TableBody>{tokens.map((token: any) => {
        return <TableRow><TableCell><Typography>{token.name}</Typography></TableCell> <TableCell><Typography>{token.symbol}</Typography></TableCell>  <TableCell><Typography>{token.address}</Typography></TableCell> <TableCell><Typography>{token.balance.toLocaleString()}</Typography></TableCell>  </TableRow>
      } )}</TableBody></Table></TableContainer>
*/
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  );

const TokenInfo: React.FC<{ tokens: any[], nftName: any}> = ({ tokens,nftName}) => {
    function random_rgba() {
        var o = Math.round, r = Math.random, s = 100;
        return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
    }
    const options = {
        onClick: (e:any, element: any) => {
            if (element.length > 0) {
              const index = element[0].datasetIndex
            const address = e.chart.config._config.data.datasets[index].address
            window.open(`https://etherscan.io/token/${address}`,"_blank")
            }
          },
        indexAxis: 'y' as const,
        elements: {
          bar: {
            borderWidth: 2
          },
        },
        responsive: true,
        plugins: {
          legend: {
            position: 'right' as const,
          },
          title: {
            display: true,
            text: `Mean value of tokens owned by ${nftName.name} ${nftName.symbol} owners in USD`,
          },
        },
      };
    const labels = [`ERC-20 tokens in use by ${nftName.name} ${nftName.symbol} owners (in billions)`]
    const data = {
        labels,
        datasets: tokens.map(token => {
            const color = random_rgba()
            return {
                label: `${token.name}(${token.symbol})`,
                data: [token.balance/1000000000],
                borderColor: color ,
                backgroundColor: color,
                address: token.address
              }
        })
      };
return (
<Stack p={2} justifyContent="center">
{tokens && <Bar data={data} options={options} />}
</Stack>
);
}

export default TokenInfo;
