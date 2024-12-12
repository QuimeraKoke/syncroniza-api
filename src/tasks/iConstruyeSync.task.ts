import connect from '../config/mongo.config';
import axios from 'axios';
import Transaction from '../models/transaction.schema';
import Project from '../models/project.schema';
import ControlSheet from '../models/controlSheet.schema';
import moongoose from 'mongoose';

const dateToString = (date) => {
    // from date to string with format 2023-05-24 00:00:00
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    let monthString = month < 10 ? `0${month}` : `${month}`;
    let dayString = day < 10 ? `0${day}` : `${day}`;
    let hoursString = hours < 10 ? `0${hours}` : `${hours}`;
    let minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;
    let secondsString = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${year}-${monthString}-${dayString} ${hoursString}:${minutesString}:${secondsString}`;
}

export const getInvoices = async (startDate: Date, endDate: Date, orgID: string) => {
    let invoices = [];

    let axiosClient = axios.create({
        baseURL: "https://api.iconstruye.com",
        timeout: 10000,
        headers: {
            "Ocp-Apim-Subscription-Key": "155bcbb40e44403e90a03b9d03457a87"
        }
    })

    let tmpStartDate = startDate;
    // add 30 days to the start date
    let tmpEndDate = new Date(new Date(tmpStartDate).setDate(tmpStartDate.getDate() + 29));

    while (tmpEndDate <= endDate) {
        let url = `/cvbf/api/Factura/Buscar?api-version=1.0&IdOrgc=${orgID}&FechaRecepDesde=${dateToString(tmpStartDate)}&FechaRecepHasta=${dateToString(tmpEndDate)}`;

        let response = await axiosClient.get(url);

        console.log(`Getting invoices from ${dateToString(tmpStartDate)} to ${dateToString(tmpEndDate)}`);
        console.log(`Total invoices: ${response.data.length}`);

        invoices = [...invoices, ...response.data];

        // Add 1 day to the start date
        tmpStartDate = new Date(new Date(tmpEndDate).setDate(tmpEndDate.getDate() + 1));
        // Add 30 days to the end date
        tmpEndDate = new Date(new Date(tmpStartDate).setDate(tmpStartDate.getDate() + 29));
    }

    return invoices;
}

const getInvoiceDetails = async (invoiceId: string) => {
    let axiosClient = axios.create({
        baseURL: "https://api.iconstruye.com",
        timeout: 10000,
        headers: {
            "Ocp-Apim-Subscription-Key": "155bcbb40e44403e90a03b9d03457a87"
        }
    })

    let url = `/cvbf/api/Factura/PorId?IdDoc=${invoiceId}&api-version=1.0`;
    let rsp = await axiosClient.get(url);

    return rsp.data[0];
}

const syncInvoices = async (project: any, controlSheets: any[]) => {
    const startDate = project.startDate;
    const endDate = project.endDate;

    const families = project.families;

    const invoices = await getInvoices(startDate, endDate, project.organizationId);

    for (let invoice of invoices) {
        try {
            let invoiceId = invoice.idDocumento;
            let invoiceDetails = await getInvoiceDetails(invoiceId);
            // sleep a random time between 500  and 800 ms
            let sleepTime = Math.floor(Math.random() * 300) + 500;
            await new Promise((resolve) => setTimeout(resolve, sleepTime));
            let code = invoiceDetails.detalle.documentosRelacionados.ordenCompra ? invoiceDetails.detalle.documentosRelacionados.ordenCompra[0].recepcion[0].detalleRecepcion[0].distribucionCosto[0].idCentroCosto : null;
            let familyCode = code ? code.split(".")[0] : null;


            let family = familyCode ? families.find((f) => f.code === familyCode) : null;
            let controlSheet = code ? controlSheets.find((cs) => cs.codes.find((c) => c.code.includes(code))) : null;

            if (!controlSheet) {
                console.log(`ControlSheet with code ${code} not found in project ${project.name}`);
                // console.log(`Invoice ${invoiceId} will not be synced`);
                // console.log(invoiceDetails);
                console.log("-------------------------------------------------");
                // continue;
            }

            if (!family) {
                console.log(`Family with code ${familyCode} not found in project ${project.name}`);
                // console.log(`Invoice ${invoiceId} will not be synced`);
                // console.log(invoiceDetails);
                console.log("-------------------------------------------------");
                // continue;
            }

            let transaction = await Transaction.findOneAndUpdate({externalID: invoiceId}, {
                type: "FACTURA",
                date: new Date(invoiceDetails.cabecera.fecha.fechaCreacion),
                externalID: invoiceId,
                lastSync: new Date(),
                client: invoiceDetails.cabecera.emisor.razonsocialEmisor,
                description: code ? invoiceDetails.detalle.documentosRelacionados.ordenCompra[0].recepcion[0].detalleRecepcion[0].descripcion : "",
                total: invoiceDetails.cabecera.totales.total.montoTotal,
                status: invoice.estadoDoc,
                paymentStatus: invoice.estadoPago,
                rawValue: invoiceDetails,
                project: project._id,
                controlSheet: controlSheet ? controlSheet._id : null,
                family: family ? family.name : null,
            }, {upsert: true, new: true});

            console.log(`Invoice ${invoiceId} synced successfully`);

        } catch (error) {
            console.log(`Error syncing invoice ${invoice.idDocumento}`);
            console.log(error);
        }
    }

    console.log("-------------------------------------------------");
    console.log(`Invoices Project ${project.name} synced successfully`);
}

export const getOCs = async (startDate: Date, endDate: Date, orgID: string) => {
    let OCs = [];

    let axiosClient = axios.create({
        baseURL: "https://api.iconstruye.com",
        timeout: 10000,
        headers: {
            "Ocp-Apim-Subscription-Key": "05a4707486cc4b29b07831f5f4fe8bc6"
        }
    })

    let tmpStartDate = startDate;
    // add 30 days to the start date
    let tmpEndDate = new Date(new Date(tmpStartDate).setDate(tmpStartDate.getDate() + 29));

    while (tmpEndDate <= endDate) {
        let url = `ordencompra/api/ConectorBuscarOrdenCompra`;
        url = `${url}?FechaCreacionDesde=${dateToString(tmpStartDate)}&FechaCreacionHasta=${dateToString(tmpEndDate)}`;
        url = `${url}&IdOrgcOC=${orgID}&IdEstadoOc=-1&IdTipoOc=-1`;

        let response = await axiosClient.get(url);

        console.log(`Getting OCs from ${dateToString(tmpStartDate)} to ${dateToString(tmpEndDate)}`);
        console.log(`Total OCs: ${response.data.length}`);

        OCs = [...OCs, ...response.data];

        // Add 1 day to the start date
        tmpStartDate = new Date(new Date(tmpEndDate).setDate(tmpEndDate.getDate() + 1));
        // Add 30 days to the end date
        tmpEndDate = new Date(new Date(tmpStartDate).setDate(tmpStartDate.getDate() + 29));
    }

    return OCs;
}

export const getOCDetails = async (OCId: string) => {
    let axiosClient = axios.create({
        baseURL: "https://api.iconstruye.com",
        timeout: 10000,
        headers: {
            "Ocp-Apim-Subscription-Key": "05a4707486cc4b29b07831f5f4fe8bc6"
        }
    })

    let url = `/ordencompra/api/ConectorOrdenCompraCreada?IdDoc=${OCId}&api-version=1,0`;
    let rsp = await axiosClient.get(url);

    return rsp.data[0];
}

export const syncOCs = async (project: any, controlSheets: any[]) => {
    const startDate = project.startDate;
    const endDate = project.endDate;

    const families = project.families;

    const OCs = await getOCs(startDate, endDate, project.organizationId);

    for (let OC of OCs) {
        try {

            let OCId = OC.idDocumento;
            let OCDetails = await getOCDetails(OCId);
            // sleep a random time between 500  and 800 ms
            let sleepTime = Math.floor(Math.random() * 300) + 500;
            await new Promise((resolve) => setTimeout(resolve, sleepTime));
            let code = OCDetails.detalle.lineas[0].distribucionCosto[0].idCentCosto;
            let familyCode = code ? code.split(".")[0] : null;


            let family = familyCode ? families.find((f) => f.code === familyCode) : null;
            let controlSheet = code ? controlSheets.find((cs) => cs.codes.find((c) => c.code.includes(code))) : null;


            if (!controlSheet) {
                console.log(`ControlSheet with code ${code} not found in project ${project.name}`);
                // console.log(`OC ${OCId} will not be synced`);
                // console.log(OCDetails);
                console.log("-------------------------------------------------");
            }

            if (!family) {
                console.log(`Family with code ${familyCode} not found in project ${project.name}`);
                // console.log(`OC ${OCId} will not be synced`);
                // console.log(OCDetails);
                console.log("-------------------------------------------------");
            }

            let transaction = await Transaction.findOneAndUpdate({externalID: OCId}, {
                type: "OC",
                date: new Date(OCDetails.cabecera.documento.fechaCreacion),
                externalID: OCId,
                lastSync: new Date(),
                client: OCDetails.cabecera.receptor.razonSocialReceptor,
                description: OCDetails.detalle.lineas[0].recurso.descripItem,
                total: OCDetails.cabecera.totales.montoTotal,
                status: OCDetails.cabecera.estado.descripEstadoDocumento,
                rawValue: OCDetails,
                project: project._id,
                controlSheet: controlSheet ? controlSheet._id : null,
                family: family ? family.name : null,
            }, {upsert: true, new: true});

            console.log(`OC ${OCId} synced successfully`);
        } catch (error) {
            console.log(`Error syncing OC ${OC.idDocumento}`);
            console.log(error);
        }
    }
}

export const getNNCCs = async (startDate: Date, endDate: Date, orgID: string) => {
    let NNCCs = [];

    let axiosClient = axios.create({
        baseURL: "https://api.iconstruye.com",
        timeout: 10000,
        headers: {
            "Ocp-Apim-Subscription-Key": "155bcbb40e44403e90a03b9d03457a87"
        }
    })

    let tmpStartDate = startDate;
    // add 30 days to the start date
    let tmpEndDate = new Date(new Date(tmpStartDate).setDate(tmpStartDate.getDate() + 29));

    while (tmpEndDate <= endDate) {
        let url = `/cvbf/api/NotasCorreccion/Buscar?api-version=1.0&IdOrgc=${orgID}&FechaRecepDesde=${dateToString(tmpStartDate)}&FechaRecepHasta=${dateToString(tmpEndDate)}`;

        let response = await axiosClient.get(url);

        console.log(`Getting NNCCs from ${dateToString(tmpStartDate)} to ${dateToString(tmpEndDate)}`);
        console.log(`Total NNCCs: ${response.data.length}`);

        NNCCs = [...NNCCs, ...response.data];

        // Add 1 day to the start date
        tmpStartDate = new Date(new Date(tmpEndDate).setDate(tmpEndDate.getDate() + 1));
        // Add 30 days to the end date
        tmpEndDate = new Date(new Date(tmpStartDate).setDate(tmpStartDate.getDate() + 29));
    }

    return NNCCs;
}

export const getNNCCDetails = async (NNCCId: string) => {
    let axiosClient = axios.create({
        baseURL: "https://api.iconstruye.com",
        timeout: 10000,
        headers: {
            "Ocp-Apim-Subscription-Key": "155bcbb40e44403e90a03b9d03457a87"
        }
    })

    let url = `/cvbf/api/NotasCorreccion/PorId?IdDoc=${NNCCId}&api-version=1.0`;
    let rsp = await axiosClient.get(url);

    return rsp.data[0];
}

export const syncNNCCs = async (project: any, controlSheets: any[]) => {
    const startDate = project.startDate;
    const endDate = project.endDate;

    const families = project.families;

    const NNCCs = await getNNCCs(startDate, endDate, project.organizationId);

    // console.log(NNCCs[0]);

    for (let NNCC of NNCCs) {
        try {

            let invoice = null
            if (NNCC.factAsociada) {
                invoice = await Transaction.findOne({"rawValue.cabecera.documento.numDocumento": NNCC.factAsociada}).lean();
            }

            let transaction = await Transaction.findOneAndUpdate({externalID: NNCC.idDocumento}, {
                type: "NNCC",
                date: new Date(NNCC.fechaRecepcion),
                externalID: NNCC.idDocumento,
                lastSync: new Date(),
                client: NNCC.nombreProveedor,
                description: "",
                total: NNCC.montoTotal,
                status: NNCC.estadoDoc,
                rawValue: NNCC,
                project: project._id,
                controlSheet: invoice ? invoice.controlSheet : null,
                family: invoice ? invoice.family : null,
            }, {upsert: true, new: true});

            console.log(`NNCC ${NNCC.idDocumento} synced successfully`);

        } catch (error) {
            console.log(`Error syncing NNCC ${NNCC.idDocumento}`);
            console.log(error);
        }
    }
}

const syncProject = async (projectId: string) => {
    const project = await Project.findById(projectId).lean();
    const controlSheets = await ControlSheet.find({project: projectId}).lean();

    console.log(`Syncing OCs for project ${project.name}`);
    await syncOCs(project, controlSheets);

    console.log("-------------------------------------------------");
    console.log(`OC Project ${project.name} synced successfully`);

    // console.log(`Syncing Invoices for project ${project.name}`);
    await syncInvoices(project, controlSheets);
    //
    // console.log("-------------------------------------------------");
    // console.log(`Invoices Project ${project.name} synced successfully`);
    //
    // console.log(`Syncing NNCCs for project ${project.name}`);
    // await syncNNCCs(project, controlSheets);

    console.log("-------------------------------------------------");
    console.log(`NNCCs Project ${project.name} synced successfully`);
}

export const iConstruyeSync = async () => {
    await connect();

    const projects = await Project.find();

    for (let project of projects) {
        await syncProject(project._id.toString());
    }

    process.exit(0);
}

(async () =>  {
    await iConstruyeSync();
})();

// process.exit(0);