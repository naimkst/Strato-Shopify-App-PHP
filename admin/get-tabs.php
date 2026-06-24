<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require '../connect.php';

/**
 * ============================================================
 * 1️⃣ Special endpoint for fetching base image by option_id
 * ============================================================
 */
if (isset($_GET['action']) && $_GET['action'] === 'get_base_image_tab_options' && isset($_GET['option_id'])) {
    $option_id = (int)$_GET['option_id'];
    $stmt = $conn->prepare("SELECT image_url FROM tab_options WHERE id = ?");
    $stmt->bind_param("i", $option_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $base_image_svg = $result ? $result['image_url'] : '';
    echo json_encode(["base_image_svg" => $base_image_svg]);
    exit;
}

/**
 * ============================================================
 * 2️⃣ Default: return full configuration tree
 *     tabs → subtabs → sections → options
 * ============================================================
 */

$tabs = [];

// Fetch all tabs
$tabSql = "SELECT * FROM tabs ORDER BY order_index";
$tabResult = $conn->query($tabSql);

while ($tab = $tabResult->fetch_assoc()) {
    $tab_id = (int)$tab['id'];

    // (A) Fetch tab-level options (old behavior)
    $tabOptSql = "SELECT * FROM tab_options WHERE tab_id = $tab_id ORDER BY id";
    $tabOptResult = $conn->query($tabOptSql);
    $tab_options = [];
    while ($opt = $tabOptResult->fetch_assoc()) {
        $tab_options[] = $opt;
    }
    $tab['options'] = $tab_options;

    // (B) Fetch subtabs
    $subtabs = [];
    $subtabSql = "SELECT * FROM subtabs WHERE tab_id = $tab_id ORDER BY order_index";
    $subtabResult = $conn->query($subtabSql);

    while ($subtab = $subtabResult->fetch_assoc()) {
        $subtab_id = (int)$subtab['id'];

        // (B1) Old flat options list for backward compatibility
        $subtabOptSql = "SELECT * FROM tab_options WHERE subtab_id = $subtab_id ORDER BY id";
        $subtabOptResult = $conn->query($subtabOptSql);
        $flat_options = [];
        while ($subOpt = $subtabOptResult->fetch_assoc()) {
            $flat_options[] = $subOpt;
        }
        $subtab['options'] = $flat_options;

        // (B2) NEW: Sections (with options inside each)
        $sections = [];
        $secSql = "SELECT * FROM subtab_sections WHERE subtab_id = $subtab_id ORDER BY order_index, id";
        $secRes = $conn->query($secSql);

        if ($secRes && $secRes->num_rows > 0) {
            while ($sec = $secRes->fetch_assoc()) {
                $sec_id = (int)$sec['id'];
                $secOptSql = "SELECT * FROM tab_options WHERE subtab_id = $subtab_id AND section_id = $sec_id ORDER BY id";
                $secOptRes = $conn->query($secOptSql);

                $sec_options = [];
                while ($so = $secOptRes->fetch_assoc()) {
                    $sec_options[] = $so;
                }

                $sections[] = [
                    "id" => $sec_id,
                    "name" => $sec['name'],
                    "order_index" => (int)$sec['order_index'],
                    "options" => $sec_options
                ];
            }

            // (Optional) include unsectioned options as last group
            $unSecSql = "SELECT * FROM tab_options WHERE subtab_id = $subtab_id AND section_id IS NULL ORDER BY id";
            $unSecRes = $conn->query($unSecSql);
            if ($unSecRes && $unSecRes->num_rows > 0) {
                $un_options = [];
                while ($uo = $unSecRes->fetch_assoc()) {
                    $un_options[] = $uo;
                }

                $sections[] = [
                    "id" => null,
                    "name" => "Weitere Optionen",
                    "order_index" => 9999,
                    "options" => $un_options
                ];
            }
        }

        $subtab['sections'] = $sections; // Always exists (can be empty [])
        $subtabs[] = $subtab;
    }

    $tab['subtabs'] = $subtabs;
    $tabs[] = $tab;
}

/**
 * ============================================================
 * 3️⃣ Include other data (same as your original)
 * ============================================================
 */

// height_width_prices
$hw_prices = [];
$hwSql = "SELECT * FROM height_width_prices ORDER BY id";
$hwResult = $conn->query($hwSql);
while ($row = $hwResult->fetch_assoc()) {
    $hw_prices[] = $row;
}

// combo_options
$combo_options = [];
$comboSql = "SELECT * FROM combo_options";
$comboResult = $conn->query($comboSql);
while ($row = $comboResult->fetch_assoc()) {
    $combo_options[] = $row;
}

/**
 * ============================================================
 * 4️⃣ Final JSON response
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
