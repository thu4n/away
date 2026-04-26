resource "cloudflare_d1_database" "away" {
  account_id       = local.account_id
  name             = "${local.project_prefix}-db"
  read_replication = { mode = "disabled" }
}

resource "cloudflare_r2_bucket" "away" {
  account_id = local.account_id
  name       = "${local.project_prefix}-bucket"
}

resource "cloudflare_worker" "away" {
  account_id    = local.account_id
  name          = local.project_prefix
  observability = { enabled = true }

  lifecycle {
    ignore_changes = [
      subdomain,
      observability,
    ]
  }
}
