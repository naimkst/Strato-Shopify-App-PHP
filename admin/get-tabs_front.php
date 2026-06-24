<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

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
    $tabOptResult = $conn->query("SELECT * FROM tab_options WHERE tab_id = $tab_id ORDER BY id");

    while ($opt = $tabOptResult->fetch_assoc()) {
        $tab_options[] = $opt;
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

        // =========================
        // OPTIONS
        // =========================
        $flat_options = [];

        if (!$isHeavy) {
            $res = $conn->query("SELECT * FROM tab_options WHERE subtab_id = $subtab_id ORDER BY id");
            while ($row = $res->fetch_assoc()) {
                $flat_options[] = $row;
            }
        }

        $subtab['options'] = $flat_options;

        // =========================
        // SECTIONS
        // =========================
        $sections = [];

        if (!$isHeavy) {

            $secRes = $conn->query("SELECT * FROM subtab_sections WHERE subtab_id = $subtab_id ORDER BY order_index, id");

            if ($secRes && $secRes->num_rows > 0) {

                while ($sec = $secRes->fetch_assoc()) {

                    $sec_id = (int)$sec['id'];

                    $sec_options = [];
                    $r = $conn->query("SELECT * FROM tab_options WHERE subtab_id = $subtab_id AND section_id = $sec_id ORDER BY id");

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
                $unRes = $conn->query("SELECT * FROM tab_options WHERE subtab_id = $subtab_id AND section_id IS NULL ORDER BY id");

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

// height_width_prices
$hw_prices = [];
$res = $conn->query("SELECT * FROM height_width_prices ORDER BY id");
while ($row = $res->fetch_assoc()) {
    $hw_prices[] = $row;
}

// combo_options
$combo_options = [];
$res2 = $conn->query("SELECT * FROM combo_options");
while ($row = $res2->fetch_assoc()) {
    $combo_options[] = $row;
}

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