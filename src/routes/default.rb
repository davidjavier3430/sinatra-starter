class MyApplication < Sinatra::Base

  get "/" do
    @title = "Choose your Route"
    @hide_routes_list = true
    erb :index
  end

  get "/rides/new" do
    @title = "Create Route"
    @hide_create_route = true
    @ride = Ride.new
    erb :new
  end

  post "/rides/new" do
    @title = "Create Route"
    @hide_create_route = true
    @ride = Ride.create( params["ride"] )
    if @ride.errors.size > 0
      erb :new
    else
      redirect "/rides/#{@ride.id}"
    end

  end

  get "/rides/:id" do
    @title = "Route Info"
    ride_id =  params[:id]
    @ride = Ride.find(ride_id)
    @miles = '%.2f' % @ride.route['meters'].meters.to.miles
    erb :show
  end

end
