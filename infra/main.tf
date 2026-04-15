resource "cloudflare_d1_database" "away" {
  account_id = local.account_id
  name       = "${local.project_prefix}-db"
}

resource "cloudflare_r2_bucket" "away" {
  account_id = local.account_id
  name       = "${local.project_prefix}-bucket"
}
