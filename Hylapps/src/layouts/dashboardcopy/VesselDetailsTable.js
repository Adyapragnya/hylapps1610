import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ReactDataGrid from '@inovua/reactdatagrid-community';
import '@inovua/reactdatagrid-community/index.css';
import axios from 'axios';
import { Button, Menu, MenuItem, Box } from '@mui/material';
import Swal from 'sweetalert2';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import DeleteIcon from '@mui/icons-material/Delete'; // Import Material-UI Delete icon
import './Swal.css';

const VesselDetailsTable = ({ highlightRow, onRowClick }) => {
  const [vessels, setVessels] = useState([]);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        const baseURL = process.env.REACT_APP_API_BASE_URL;
        const response = await axios.get(`${baseURL}/api/get-tracked-vessels`);

        const formattedData = response.data
          .filter(vessel => vessel.trackingFlag)
          .map(vessel => ({
            NAME: vessel.AIS?.NAME || '',
            TYPE: vessel.SpireTransportType || '',
            IMO: vessel.AIS?.IMO || 0,
            ETA: vessel.AIS?.ETA || '',
            SPEED: vessel.AIS?.SPEED || 0,
            LATITUDE: vessel.AIS?.LATITUDE || 0,
            LONGITUDE: vessel.AIS?.LONGITUDE || 0,
            DESTINATION: vessel.AIS?.DESTINATION || '',
            HEADING: vessel.AIS?.HEADING || '',
            ZONE: vessel.AIS?.ZONE || '',
            selected: false, // Add a selected field to manage checkbox state
            isNew: isNewVessel(vessel),
          }));

        setVessels(formattedData.reverse());
      } catch (error) {
        console.error('Error fetching tracked vessels:', error);
        setError(error.message);
      }
    };

    fetchVessels();
  }, []);

  const isNewVessel = (vessel) => {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    return new Date(vessel.timestamp) > oneMinuteAgo;
  };

  const handleRowClick = (row) => {
    const { NAME, IMO, LATITUDE, LONGITUDE, HEADING, ETA, DESTINATION } = row.data;
    onRowClick({ name: NAME, imo: IMO, lat: LATITUDE, lng: LONGITUDE, heading: HEADING, eta: ETA, destination: DESTINATION });
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
  };

  const filteredVessels = vessels.filter(vessel =>
    Object.values(vessel).some(value =>
      value.toString().toLowerCase().includes(searchValue.toLowerCase())
    )
  );

  const handleRowSelection = (rowData) => {
    const updatedVessels = vessels.map(vessel => {
      if (vessel.IMO === rowData.IMO) {
        return { ...vessel, selected: !vessel.selected }; // Toggle selected state
      }
      return vessel;
    });

    setVessels(updatedVessels);
    const newSelectedRows = updatedVessels.filter(vessel => vessel.selected);
    setSelectedRows(newSelectedRows.map(vessel => vessel.IMO));
  };

  const handleDeleteSelected = async () => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to delete selected vessels from tracking?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        popup: 'custom-swal', // Apply your custom class
      },
    });
  
    if (result.isConfirmed) {
      const baseURL = process.env.REACT_APP_API_BASE_URL;
  
      try {
        // Send PATCH requests for each selected vessel
        await Promise.all(
          selectedRows.map(async (imo) => {
            await axios.patch(`${baseURL}/api/update-vessel`, {
              imoNumber: imo,
              trackingFlag: false, // Set trackingFlag to false
            });
          })
        );
  
        // Remove selected vessels from the local state
        const updatedVessels = vessels.filter(vessel => !vessel.selected);
        setVessels(updatedVessels);
        setSelectedRows([]); // Clear selected rows
  
        Swal.fire('Deleted!', 'Your selected vessels have been deleted.', 'success');
      } catch (error) {
        console.error('Error updating vessels:', error);
        Swal.fire('Error!', 'There was an error deleting the vessels.', 'error');
      }
    }
  };
  

  const columns = [
    { 
      name: 'select', 
      header: '', 
      defaultWidth: 50, 
      headerAlign: 'center', 
      align: 'center', 
      flex: 0.2,
      render: ({ data }) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <input 
            type="checkbox" 
            checked={data.selected} 
            onChange={() => handleRowSelection(data)} 
            style={{ width: '20px', height: '20px' }} // Adjust size here
          />
        </div>
      ),
    },
    { name: 'NAME', header: 'Name', minWidth: 80, flex: 1 }, // Non-movable Name column
    { name: 'TYPE', header: 'Type', minWidth: 80, flex: 1 },
    { name: 'IMO', header: 'IMO', minWidth: 80, flex: 1 },
    { name: 'ETA', header: 'ETA', minWidth: 80, flex: 1 },
    { name: 'DESTINATION', header: 'Destination', minWidth: 80, flex: 1 },
    { name: 'SPEED', header: 'Speed', maxWidth: 80, flex: 0.5 },
    { name: 'LATITUDE', header: 'Latitude', maxWidth: 80, flex: 0.5 },
    { name: 'LONGITUDE', header: 'Longitude', maxWidth: 80, flex: 0.5 },
    { name: 'HEADING', header: 'Heading', maxWidth: 80, flex: 0.5 },
    { name: 'ZONE', header: 'Zone', maxWidth: 80, flex: 0.5 },
    { name: 'Order No', header: 'order no', maxWidth: 80, flex: 0.5 },
    { name: 'Order Status', header: 'order status', maxWidth: 80, flex: 0.5 },
  ];
  

  const csvHeaders = columns.map(c => ({ label: c.header, key: c.name }));
  const csvData = filteredVessels;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Vessel Details', 20, 10);
    doc.autoTable({
      head: [columns.map(c => c.header)],
      body: filteredVessels.map(vessel => columns.map(c => vessel[c.name] || '')),
    });
    doc.save('vessel-details.pdf');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Vessel Details</title>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>Vessel Details</h2>');
    printWindow.document.write('<table border="1" style="width: 100%; border-collapse: collapse;">');
    printWindow.document.write('<thead><tr>');
    columns.forEach(col => {
      printWindow.document.write(`<th style="background-color: blue; color: white; text-align: center;">${col.header}</th>`);
    });
    printWindow.document.write('</tr></thead><tbody>');
    filteredVessels.forEach(vessel => {
      printWindow.document.write('<tr>');
      columns.forEach(col => {
        printWindow.document.write(`<td>${vessel[col.name] || ''}</td>`);
      });
      printWindow.document.write('</tr>');
    });
    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ position: 'relative', minHeight: 450 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            sx={{ color: '#FFFFFF', backgroundColor: '#1976d2', fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Export Data&nbsp;<i className="fa fa-database" style={{ color: "white" }}></i>
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem>
              <CSVLink data={csvData} headers={csvHeaders} filename="vessel-details.csv" style={{ textDecoration: 'none', color: '#01204E' }}>
                <i className="fa fa-file-excel-o"></i>&nbsp;Export as CSV 
              </CSVLink>
            </MenuItem>
            <MenuItem onClick={exportPDF} style={{ textDecoration: 'none', color: '#01204E' }}><i className="fa fa-file-pdf" ></i>&nbsp;Export as PDF </MenuItem>
            <MenuItem onClick={handlePrint} style={{ textDecoration: 'none', color: '#01204E' }}><i className="fa fa-print"></i>&nbsp;Print </MenuItem>
          </Menu>
        
          {selectedRows.length > 0 && (
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleDeleteSelected}
              sx={{ minWidth: '40px', padding: 0, marginRight: '10px',marginLeft: '5px' }} // Min width for the icon button
            >
              <DeleteIcon />
            </Button>
          )}
        </Box>
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchValue} 
          onChange={handleSearchChange} 
          style={{ padding: '10px', width: '200px' }} // Adjust width as needed
        />
      </Box>
      <ReactDataGrid
        idProperty="IMO"
        columns={columns}
        dataSource={filteredVessels}
        style={{ minHeight: 400, width: '100%' }}
        onRowClick={handleRowClick}
        enableRowSelection
        selection={selectedRows}
      />
    </div>
  );
};

VesselDetailsTable.propTypes = {
  highlightRow: PropTypes.bool,
  onRowClick: PropTypes.func.isRequired,
};

VesselDetailsTable.defaultProps = {
  highlightRow: false,
};

export default VesselDetailsTable;
