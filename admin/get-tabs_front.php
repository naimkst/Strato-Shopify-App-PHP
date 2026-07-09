<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

require '../connect.php';

/**
 * ============================================================
 * 1️⃣ Special endpoint for fetching base image
 * ============================================================
 */
if (isset($_GET['action']) && $_GET['action'] === 'get_base_image_tab_options' && isset($_GET['option_id'])) {
    $option_id = (int)$_GET['option_id'];
    $stmt = $conn->prepare("SELECT image_url FROM tab_options WHERE id = ?");
    $stmt->bind_param("i", $option_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    echo json_encode([
        "base_image_svg" => $result ? $result['image_url'] : ''
    ]);
    exit;
}

/**
 * ============================================================
 * 2️⃣ Main JSON (tabs → subtabs → sections → options)
 * ============================================================
 */

$tabs = [];

$tabSql = "SELECT * FROM tabs ORDER BY order_index";
$tabResult = $conn->query($tabSql);

while ($tab = $tabResult->fetch_assoc()) {

    $tab_id = (int)$tab['id'];

    // TAB OPTIONS
    $tab_options = [];

    // Only profiles are needed for the first render. Tab 2/3 combo SVG rows are
    // loaded lazily after profile/wing selection to keep the initial payload fast.
    if ($tab_id === 1) {
        $tabOptResult = $conn->query("SELECT * FROM tab_options WHERE tab_id = $tab_id ORDER BY id");

        while ($opt = $tabOptResult->fetch_assoc()) {
            $tab_options[] = $opt;
        }
    }

    $tab['options'] = $tab_options;

    // SUBTABS
    $subtabs = [];
    $subtabResult = $conn->query("SELECT * FROM subtabs WHERE tab_id = $tab_id ORDER BY order_index");

    while ($subtab = $subtabResult->fetch_assoc()) {

        $subtab_id = (int)$subtab['id'];

        // ✅ Detect heavy tabs (Farbe Innen / Außen)
        $name = strtolower($subtab['name']);
        $isHeavy =
            strpos($name, 'innen') !== false ||
            strpos($name, 'außen') !== false ||
            strpos($name, 'aussen') !== false;
        $skipInitialOptions =
            strpos($name, 'sprossen') !== false ||
            strpos($name, 'rollladen') !== false;
        $deferInitialOptions =
            $tab_id === 5 &&
            (
                strpos($name, 'griff') !== false ||
                strpos($name, 'isolierglas') !== false
            );

        // =========================
        // OPTIONS
        // =========================
        $flat_options = [];

        if (!$isHeavy && !$skipInitialOptions && !$deferInitialOptions) {
            $res = $conn->query("SELECT * FROM tab_options WHERE subtab_id = $subtab_id AND label NOT LIKE 'HW Combo:%' ORDER BY id");
            while ($row = $res->fetch_assoc()) {
                $flat_options[] = $row;
            }
        }

        $subtab['options'] = $flat_options;

        // =========================
        // SECTIONS
        // =========================
        $sections = [];

        if (!$isHeavy && !$skipInitialOptions && !$deferInitialOptions) {

            $secRes = $conn->query("SELECT * FROM subtab_sections WHERE subtab_id = $subtab_id ORDER BY order_index, id");

            if ($secRes && $secRes->num_rows > 0) {

                while ($sec = $secRes->fetch_assoc()) {

                    $sec_id = (int)$sec['id'];

                    $sec_options = [];
                    $r = $conn->query("SELECT * FROM tab_options WHERE subtab_id = $subtab_id AND section_id = $sec_id AND label NOT LIKE 'HW Combo:%' ORDER BY id");

                    while ($o = $r->fetch_assoc()) {
                        $sec_options[] = $o;
                    }

                    $sections[] = [
                        "id" => $sec_id,
                        "name" => $sec['name'],
                        "order_index" => (int)$sec['order_index'],
                        "options" => $sec_options
                    ];
                }

                // unsectioned options
                $unRes = $conn->query("SELECT * FROM tab_options WHERE subtab_id = $subtab_id AND section_id IS NULL AND label NOT LIKE 'HW Combo:%' ORDER BY id");

                if ($unRes && $unRes->num_rows > 0) {
                    $un_options = [];
                    while ($u = $unRes->fetch_assoc()) {
                        $un_options[] = $u;
                    }

                    $sections[] = [
                        "id" => null,
                        "name" => "Weitere Optionen",
                        "order_index" => 9999,
                        "options" => $un_options
                    ];
                }
            }
        }

        $subtab['sections'] = $sections;

        // ✅ KEEP subtab (important)
        $subtabs[] = $subtab;
    }

    $tab['subtabs'] = $subtabs;
    $tabs[] = $tab;
}

/**
 * ============================================================
 * 3️⃣ Extra data (UNCHANGED)
 * ============================================================
 */

// Price grids are loaded lazily from get-combos.php for the selected product
// combination. Keeping them out of this response prevents the frontend loader
// from waiting on a multi-megabyte JSON payload before the first tab can render.
$hw_prices = [];
$combo_options = [];

/**
 * ============================================================
 * 4️⃣ FINAL RESPONSE
 * ============================================================
 */
echo json_encode([
    "tabs" => $tabs,
    "height_width_prices" => $hw_prices,
    "combo_options" => $combo_options
]);

$conn->close();
exit;
?>
