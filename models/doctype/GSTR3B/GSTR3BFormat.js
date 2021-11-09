export default {
  gstin: '',
  ret_period: '',
  inward_sup: {
    isup_details: [
      {
        ty: 'GST',
        intra: 0,
        inter: 0
      },
      {
        ty: 'NONGST',
        inter: 0,
        intra: 0
      }
    ]
  },
  sup_details: {
    osup_zero: {
      csamt: 0,
      txval: 0,
      iamt: 0
    },
    osup_nil_exmp: {
      txval: 0
    },
    osup_det: {
      samt: 0,
      csamt: 0,
      txval: 0,
      camt: 0,
      iamt: 0
    },
    isup_rev: {
      samt: 0,
      csamt: 0,
      txval: 0,
      camt: 0,
      iamt: 0
    },
    osup_nongst: {
      txval: 0
    }
  },
  inter_sup: {
    unreg_details: [],
    comp_details: [],
    uin_details: []
  },
  itc_elg: {
    itc_avl: [
      {
        csamt: 0,
        samt: 0,
        ty: 'IMPG',
        camt: 0,
        iamt: 0
      },
      {
        csamt: 0,
        samt: 0,
        ty: 'IMPS',
        camt: 0,
        iamt: 0
      },
      {
        samt: 0,
        csamt: 0,
        ty: 'ISRC',
        camt: 0,
        iamt: 0
      },
      {
        ty: 'ISD',
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0
      },
      {
        samt: 0,
        csamt: 0,
        ty: 'OTH',
        camt: 0,
        iamt: 0
      }
    ],
    itc_rev: [
      {
        ty: 'RUL',
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0
      },
      {
        ty: 'OTH',
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0
      }
    ],
    itc_net: {
      samt: 0,
      csamt: 0,
      camt: 0,
      iamt: 0
    },
    itc_inelg: [
      {
        ty: 'RUL',
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0
      },
      {
        ty: 'OTH',
        iamt: 0,
        camt: 0,
        samt: 0,
        csamt: 0
      }
    ]
  }
};

function generateHTML(data) {
  let template = `
    <div class="p-5 m-5" style="font-size: 14px !important">
    <div>
      <h3 class="text-center">GSTR3B-Form</h3>
      <h5>GSTIN: &nbsp ${data.gstin}</h5>
      <h5>Period: &nbsp ${data.ret_period}</h5>
    </div>

    <h5>3.1&nbsp&nbspDetails of Outward Supplies and inward supplies liable to reverse charge</h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Nature Of Supplies</th>
          <th>Total Taxable value</th>
          <th>Integrated Tax</th>
          <th>Central Tax</th>
          <th>State/UT Tax</th>
          <th>Cess</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>(a) Outward taxable supplies(other than zero rated, nil rated and exempted</td>
          <td class="right">${data.sup_details.osup_det.txval}</td>
          <td class="right">${data.sup_details.osup_det.iamt}</td>
          <td class="right">${data.sup_details.osup_det.camt}</td>
          <td class="right">${data.sup_details.osup_det.samt}</td>
          <td class="right">${data.sup_details.osup_det.csamt}</td>
        </tr>
        <tr>
          <td>(b) Outward taxable supplies(zero rated)</td>
          <td class="right">${data.sup_details.osup_zero.txval}</td>
          <td class="right">${data.sup_details.osup_zero.iamt}</td>
          <td style="background-color:#d9d9d9;"></td>
          <td style="background-color:#d9d9d9;"></td>
          <td class="right">${data.sup_details.osup_zero.csamt}</td>
        </tr>
        <tr>
          <td>(b) Other outward supplies(Nil rated,Exempted)</td>
          <td class="right">${data.sup_details.osup_nil_exmp.txval}</td>
          <td style="background-color:#d9d9d9;"></td>
          <td style="background-color:#d9d9d9;"></td>
          <td style="background-color:#d9d9d9;"></td>
          <td style="background-color:#d9d9d9;"></td>
        <tr>
          <td>(d) Inward Supplies(liable to reverse charge</td>
          <td class="right">${data.sup_details.isup_rev.txval}</td>
          <td class="right">${data.sup_details.isup_rev.iamt}</td>
          <td class="right">${data.sup_details.isup_rev.camt}</td>
          <td class="right">${data.sup_details.isup_rev.samt}</td>
          <td class="right">${data.sup_details.isup_rev.csamt}</td>
        </tr>
        <tr>
          <td>(e) Non-GST outward supplies</td>
          <td class="right">${data.sup_details.osup_nongst.txval}</td>
          <td style="background-color:#d9d9d9;"></td>
          <td style="background-color:#d9d9d9;"></td>
          <td style="background-color:#d9d9d9;"></td>
          <td style="background-color:#d9d9d9;"></td>
        </tr>
      </tbody>
    </table>

    <h5>
      3.2&nbsp&nbspOf the supplies shown in 3.1 (a) above, details of inter-State supplies made to unregisterd
      persons, composition taxable persons and UIN holders
    </h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th></th>
          <th>Place Of Supply (State/UT)</th>
          <th>Total Taxable Value</th>
          <th>Amount of Integrated Tax</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Supplies made to Unregistered Persons</td>
          <td class="right">`;
  for (let row of data.inter_sup.unreg_details) {
    if (row) template += row.pos + '<br>';
  }
  template += '</td><td class="right">';
  for (let row of data.inter_sup.unreg_details) {
    if (row) template += row.txval + '<br>';
  }
  template += '</td><td class="right">';
  for (let row of data.inter_sup.unreg_details) {
    if (row) template += row.iamt + '<br>';
  }

  template +=
    '</td></tr><tr><td>Supplies made to Composition Taxable Persons</td><td class="right">';
  for (let row of data.inter_sup.comp_details) {
    if (row) template += row.pos + '<br>';
  }
  template += '</td><td class="right">';
  for (let row of data.inter_sup.comp_details) {
    if (row) template += row.txval + '<br>';
  }
  template += '</td><td class="right">';
  for (let row of data.inter_sup.comp_details) {
    if (row) template += row.iamt + '<br>';
  }

  template +=
    '</td></tr><tr><td>Supplies made to UIN holders</td><td class="right">';
  for (let row of data.inter_sup.uin_details) {
    if (row) template += row.pos + '<br>';
  }
  template += '</td><td class="right">';
  for (let row of data.inter_sup.uin_details) {
    if (row) template += row.txval + '<br>';
  }
  template += '</td><td class="right">';
  for (let row of data.inter_sup.uin_details) {
    if (row) template += row.iamt + '<br>';
  }

  template += `</td>
        </tr>
      </tbody>
    </table>

    <h5>4. &nbsp Eligible ITC</h5>
    <table class="table table-bordered">
        <thead>
          <tr>
            <th>Details</th>
            <th>Integrated Tax</th>
            <th>Central Tax</th>
            <th>State/UT tax</th>
            <th>Cess</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>(A) ITC Available (whether in full op part)</b></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>&nbsp (1) Import of goods </td>
            <td class="right">${data.itc_elg.itc_avl[0].iamt}</td>
            <td class="right">${data.itc_elg.itc_avl[0].camt}</td>
            <td class="right">${data.itc_elg.itc_avl[0].samt}</td>
            <td class="right">${data.itc_elg.itc_avl[0].csamt}</td>
          </tr>
          <tr>
            <td>&nbsp (2) Import of services</td>
            <td class="right">${data.itc_elg.itc_avl[1].iamt}</td>
            <td class="right">${data.itc_elg.itc_avl[1].camt}</td>
            <td class="right">${data.itc_elg.itc_avl[1].samt}</td>
            <td class="right">${data.itc_elg.itc_avl[1].csamt}</td>
          </tr>
          <tr>
            <td>&nbsp (3) Inward supplies liable to reverse charge (other than 1 & 2 above)</td>
            <td class="right">${data.itc_elg.itc_avl[2].iamt}</td>
            <td class="right">${data.itc_elg.itc_avl[2].camt}</td>
            <td class="right">${data.itc_elg.itc_avl[2].samt}</td>
            <td class="right">${data.itc_elg.itc_avl[2].csamt}</td>
          </tr>
          <tr>
            <td>&nbsp (4) Inward supplies from ISD</td>
            <td class="right">${data.itc_elg.itc_avl[3].iamt}</td>
            <td class="right">${data.itc_elg.itc_avl[3].camt}</td>
            <td class="right">${data.itc_elg.itc_avl[3].samt}</td>
            <td class="right">${data.itc_elg.itc_avl[3].csamt}</td>
          </tr>
          <tr>
            <td>&nbsp (5) All other ITC</td>
            <td class="right">${data.itc_elg.itc_avl[4].iamt}</td>
            <td class="right">${data.itc_elg.itc_avl[4].camt}</td>
            <td class="right">${data.itc_elg.itc_avl[4].samt}</td>
            <td class="right">${data.itc_elg.itc_avl[4].csamt}</td>
          </tr>
          <tr>
            <td><b>(B) ITC Reversed</b></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>&nbsp (1) As per rules 42 & 43 of CGST Rules</td>
            <td class="right">${data.itc_elg.itc_rev[0].iamt}</td>
            <td class="right">${data.itc_elg.itc_rev[0].camt}</td>
            <td class="right">${data.itc_elg.itc_rev[0].samt}</td>
            <td class="right">${data.itc_elg.itc_rev[0].csamt}</td>
          </tr>
          <tr>
            <td>&nbsp (2) Others</td>
            <td class="right">${data.itc_elg.itc_rev[1].iamt}</td>
            <td class="right">${data.itc_elg.itc_rev[1].camt}</td>
            <td class="right">${data.itc_elg.itc_rev[1].samt}</td>
            <td class="right">${data.itc_elg.itc_rev[1].csamt}</td>
          </tr>
          <tr>
            <td><b>(C) Net ITC Available(A) - (B)</b></td>
            <td class="right">${data.itc_elg.itc_net.iamt}</td>
            <td class="right">${data.itc_elg.itc_net.camt}</td>
            <td class="right">${data.itc_elg.itc_net.samt}</td>
            <td class="right">${data.itc_elg.itc_net.csamt}</td>
          </tr>
          <tr>
            <td><b>(D) Ineligible ITC</b></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>&nbsp (1) As per section 17(5)</td>
            <td class="right">${data.itc_elg.itc_inelg[0].iamt}</td>
            <td class="right">${data.itc_elg.itc_inelg[0].camt}</td>
            <td class="right">${data.itc_elg.itc_inelg[0].samt}</td>
            <td class="right">${data.itc_elg.itc_inelg[0].csamt}</td>
          </tr>
          <tr>
            <td>&nbsp (2) Others</td>
            <td class="right">${data.itc_elg.itc_inelg[1].iamt}</td>
            <td class="right">${data.itc_elg.itc_inelg[1].camt}</td>
            <td class="right">${data.itc_elg.itc_inelg[1].samt}</td>
            <td class="right">${data.itc_elg.itc_inelg[1].csamt}</td>
          </tr>
        </tbody>
      </table>

    <h5>5. &nbsp&nbsp Values of exempt, nil rated and non-GST inward supplies</h5>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Nature of Supplies</th>
          <th>Inter-State Supplies</th>
          <th>Intra-State Supplies</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>From a supplier under composition scheme, Exempt and Nil rated</td>
          <td class="right">${data.inward_sup.isup_details[0].inter}</td>
          <td class="right">${data.inward_sup.isup_details[0].intra}</td>
        </tr>
        <tr>
          <td>Non GST Inward Supplies</td>
          <td class="right">${data.inward_sup.isup_details[1].inter}</td>
          <td class="right">${data.inward_sup.isup_details[1].intra}</td>
        </tr>
      </tbody>
    </table>
    </div>`;

  return template;
}