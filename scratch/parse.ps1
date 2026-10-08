$xml = [xml](Get-Content -Path "C:\Users\katad\.gemini\antigravity-ide\scratch\backpack-battles-wiki\extracted\word\document.xml" -Encoding UTF8)
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
$nodes = $xml.SelectNodes("//w:p", $ns)
foreach ($node in $nodes) {
    $tNodes = $node.SelectNodes(".//w:t", $ns)
    $text = ($tNodes | ForEach-Object { $_.InnerText }) -join ""
    if ($text) {
        Write-Output $text
    }
}
