import { Router } from 'express'
import ExcelJS from 'exceljs'
import { query } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth, requireRole('cda_admin'))

function sendWorkbook(res, workbook, filename) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  return workbook.xlsx.write(res).then(() => res.end())
}

/**
 * GET /api/reports/payments.xlsx?year=2026&category=rent|bill&status=success
 * The full payment ledger for the CDA's records.
 */
router.get('/payments.xlsx', async (req, res) => {
  const year = String(req.query.year || new Date().getFullYear())
  const params = [`${year}-%`]
  const filters = [`TO_CHAR(p.created_at, 'YYYY') = $1`]
  if (req.query.category) {
    params.push(req.query.category)
    filters.push(`p.category = $${params.length}`)
  }
  if (req.query.status) {
    params.push(req.query.status)
    filters.push(`p.status = $${params.length}`)
  }

  const { rows } = await query(
    `SELECT p.created_at, p.paid_at, p.receipt_no, p.paystack_reference, p.category,
            p.description, p.period, p.amount, p.status, p.channel,
            u.full_name AS tenant_name, u.phone,
            h.block, h.house_no
       FROM payments p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN houses h ON h.id = p.house_id
      WHERE ${filters.join(' AND ')}
      ORDER BY p.created_at ASC`,
    params,
  )

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'CLASPCONSTRUCTION Estate Portal'
  const sheet = workbook.addWorksheet(`Payments ${year}`)
  sheet.columns = [
    { header: 'Date Created', key: 'created_at', width: 20 },
    { header: 'Paid At', key: 'paid_at', width: 20 },
    { header: 'Receipt No', key: 'receipt_no', width: 18 },
    { header: 'Reference', key: 'paystack_reference', width: 24 },
    { header: 'Category', key: 'category', width: 10 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Period', key: 'period', width: 10 },
    { header: 'Amount (NGN)', key: 'amount', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Channel', key: 'channel', width: 14 },
    { header: 'Block', key: 'block', width: 8 },
    { header: 'House', key: 'house_no', width: 8 },
    { header: 'Tenant', key: 'tenant_name', width: 24 },
    { header: 'Phone', key: 'phone', width: 16 },
  ]
  sheet.getRow(1).font = { bold: true }
  sheet.addRows(rows)
  sheet.views = [{ state: 'frozen', ySplit: 1 }]

  await sendWorkbook(res, workbook, `claspconstruction-payments-${year}.xlsx`)
})

/**
 * GET /api/reports/defaulters.xlsx?year=2026
 * Who has not paid rent this year — with landlord contacts for follow-up.
 */
router.get('/defaulters.xlsx', async (req, res) => {
  const year = String(req.query.year || new Date().getFullYear())
  const { rows } = await query(
    `SELECT v.block, v.house_no, v.tenant_name, v.tenant_phone,
            v.landlord_name, v.landlord_phone, v.rent_amount,
            v.last_rent_paid_at, v.last_rent_period, v.last_rent_receipt
       FROM v_rent_status v
      WHERE v.tenant_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payments p
           WHERE p.house_id = v.house_id AND p.category = 'rent'
             AND p.status = 'success' AND p.period = $1
        )
      ORDER BY v.block, v.house_no::int`,
    [year],
  )

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'CLASPCONSTRUCTION Estate Portal'
  const sheet = workbook.addWorksheet(`Rent Defaulters ${year}`)
  sheet.columns = [
    { header: 'Block', key: 'block', width: 8 },
    { header: 'House', key: 'house_no', width: 8 },
    { header: 'Tenant', key: 'tenant_name', width: 24 },
    { header: 'Tenant Phone', key: 'tenant_phone', width: 16 },
    { header: 'Landlord', key: 'landlord_name', width: 24 },
    { header: 'Landlord Phone', key: 'landlord_phone', width: 16 },
    { header: `Rent Owed ${year} (NGN)`, key: 'rent_amount', width: 20 },
    { header: 'Last Rent Paid', key: 'last_rent_paid_at', width: 20 },
    { header: 'Last Rent Period', key: 'last_rent_period', width: 16 },
    { header: 'Last Receipt', key: 'last_rent_receipt', width: 18 },
  ]
  sheet.getRow(1).font = { bold: true }
  sheet.addRows(rows)
  sheet.views = [{ state: 'frozen', ySplit: 1 }]

  await sendWorkbook(res, workbook, `claspconstruction-defaulters-${year}.xlsx`)
})

export default router
