import Spinner from "./Spinner"

export default function ScreenLoading({ label = "Loading" }) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center bg-background">
      <Spinner label={label} size={26} className="text-muted-foreground" />
    </div>
  )
}
