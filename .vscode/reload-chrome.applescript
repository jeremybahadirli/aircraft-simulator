on run argv
	set targetUrl to "http://127.0.0.1:4173"

	if (count of argv) > 0 then
		set targetUrl to item 1 of argv
	end if

	try
		if application "Google Chrome" is not running then
			return
		end if

		tell application "Google Chrome"
			repeat with windowRef in windows
				repeat with tabRef in tabs of windowRef
					set tabUrl to URL of tabRef

					if tabUrl is not missing value then
						if (tabUrl as text) starts with targetUrl then
							tell tabRef to reload
						end if
					end if
				end repeat
			end repeat
		end tell
	end try
end run
